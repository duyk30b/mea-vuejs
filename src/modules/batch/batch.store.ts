import { defineStore } from 'pinia'
import { BatchDB } from '../../core/indexed-db/repository/batch.repository'
import { ProductDB } from '../../core/indexed-db/repository/product.repository'
import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { arrayToKeyValue } from '../../utils'
import type { ConditionNumber } from '../_base/base-condition'
import { useMeStore } from '../_me/me.store'
import { Product } from '../product/product.model'
import { BatchApi } from './batch.api'
import type { BatchGetOneQuery, BatchListQuery, BatchPaginationQuery } from './batch.dto'
import { Batch } from './batch.model'

export const useBatchStore = defineStore('batch-store', {
  state: () => {
    return {
      timeSync: Date.now(),
    }
  },

  actions: {
    async refreshDB() {
      let refreshTime = await RefreshTimeDB.findOneByCode('BATCH')
      if (!refreshTime) {
        refreshTime = {
          code: 'BATCH',
          dataVersion: 0,
          time: new Date(0).toISOString(),
        }
      }
      const dataVersion = useMeStore().organization.dataVersion

      let apiResponse: { time: Date; data: Batch[] }
      let hasChange = false

      if (refreshTime.dataVersion !== dataVersion) {
        hasChange = true
        await BatchDB.truncate()
        apiResponse = await BatchApi.list({})
      } else {
        const lastTime = new Date(refreshTime.time)
        apiResponse = await BatchApi.list({
          filter: { updatedAt: { GTE: lastTime } },
        })
      }

      if (apiResponse.data.length) {
        await BatchDB.upsertMany(apiResponse.data)
      }
      refreshTime.time = apiResponse.time.toISOString()
      refreshTime.dataVersion = dataVersion
      await RefreshTimeDB.upsertOne(refreshTime)

      return {
        hasChange: hasChange || !!apiResponse.data.length,
      }
    },

    async pagination(params: BatchPaginationQuery) {
      const { page, limit, relation, filter, sort } = params

      let productIdList: number[] = []
      let productList: Product[] = []
      if (filter?.product || relation?.product) {
        const productObjects = await ProductDB.findManyBy({
          id: filter?.productId,
          isActive: filter?.product?.isActive,
          productGroupId: filter?.product?.productGroupId,
          $OR: filter?.product?.searchText
            ? [
                { brandName: { LIKE: filter?.product?.searchText } },
                { substance: { LIKE: filter?.product?.searchText } },
              ]
            : undefined,
          quantity: filter?.product?.quantity,
          deletedAt: { IS_NULL: true },
        })

        productList = Product.fromList(productObjects)
        productIdList = productList.map((i) => i.id)
      }

      const productBatchPagination = await BatchDB.pagination({
        page: page || 1,
        limit: limit || 10,
        condition: {
          expiryDate: filter?.expiryDate,
          quantity: filter?.quantity,
          ...(filter?.product ? { productId: { IN: productIdList } } : {}),
          ...(filter?.productId ? { productId: filter.productId } : {}),
        },
        sort: sort || { id: 'DESC' },
      })

      const productBatchList = Batch.fromList(productBatchPagination.data)
      if (relation?.product) {
        const productMap = arrayToKeyValue(productList, 'id')
        productBatchList.forEach((i) => {
          i.product = productMap[i.productId]
        })
      }

      return {
        data: productBatchList,
        page,
        limit,
        total: productBatchPagination.total,
      }
    },

    async list(params: BatchListQuery) {
      const { filter, limit, sort } = params
      const objects = await BatchDB.findMany({
        limit,
        condition: {
          expiryDate: filter?.expiryDate,
          quantity: filter?.quantity,
          productId: filter?.productId,
          $OR: filter?.$OR,
        },
        sort,
      })
      return Batch.fromList(objects)
    },

    async getOne(params: BatchGetOneQuery) {
      const { filter } = params
      const object = await BatchDB.findOneBy({
        productId: filter?.productId,
        expiryDate: filter?.expiryDate,
        quantity: filter?.quantity,
      })
      return object ? Batch.from(object) : null
    },

    async createOne(instance: Batch) {
      const response = await BatchApi.createOne(instance)
      await BatchDB.insertOne(response)
      this.timeSync = Date.now()
      return response
    },

    async updateOne(id: number, instance: Batch) {
      const response = await BatchApi.updateOne(id, instance)
      await BatchDB.replaceOne(id, response)
      this.timeSync = Date.now()
      return response
    },

    async search(text: string, options?: { quantity?: ConditionNumber }) {
      if (!text) return []
      const productObjects = await ProductDB.findManyBy({
        $OR: [{ brandName: { LIKE: text } }, { substance: { LIKE: text } }],
        isActive: 1,
        deletedAt: { IS_NULL: true },
      })
      const productList = Product.fromList(productObjects)
      const productIdList = productList.map((i) => i.id)

      const productBatchObjects = await BatchDB.findManyBy({
        productId: { IN: productIdList },
        quantity: options?.quantity || undefined,
      })
      const productBatchList = Batch.fromList(productBatchObjects)
      const productMap = arrayToKeyValue(productList, 'id')
      productBatchList.forEach((i) => {
        i.product = productMap[i.productId]
      })

      return productBatchList
    },
  },
})
