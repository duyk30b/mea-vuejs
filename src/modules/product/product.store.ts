import { defineStore } from 'pinia'
import { ProductDB } from '../../core/indexed-db/repository/product.repository'
import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { useMeStore } from '../_me/me.store'
import { ProductApi } from './product.api'
import type { ProductListQuery, ProductPaginationQuery } from './product.dto'
import { Product } from './product.model'
import { BatchDB } from '../../core/indexed-db/repository/batch.repository'

export const useProductStore = defineStore('product-store', {
  state: () => {
    return {
      timeSync: Date.now(),
    }
  },

  actions: {
    async refreshDB() {
      let refreshTime = await RefreshTimeDB.findOneByCode('PRODUCT')
      if (!refreshTime) {
        refreshTime = {
          code: 'PRODUCT',
          dataVersion: 0,
          time: new Date(0).toISOString(),
        }
      }
      const dataVersion = useMeStore().organization.dataVersion

      let apiResponse: { time: Date; data: Product[] }
      let hasChange = false

      if (refreshTime.dataVersion !== dataVersion) {
        hasChange = true
        await ProductDB.truncate()
        apiResponse = await ProductApi.list({})
      } else {
        const lastTime = new Date(refreshTime.time)
        apiResponse = await ProductApi.list({
          filter: { updatedAt: { GTE: lastTime } },
        })
      }

      if (apiResponse.data.length) {
        await ProductDB.upsertMany(apiResponse.data)
      }
      refreshTime.time = apiResponse.time.toISOString()
      refreshTime.dataVersion = dataVersion
      await RefreshTimeDB.upsertOne(refreshTime)

      return {
        hasChange: hasChange || !!apiResponse.data.length,
      }
    },

    async pagination(params: ProductPaginationQuery) {
      const { page, limit, relation, filter, sort } = params
      const productPagination = await ProductDB.pagination({
        page: page || 1,
        limit: limit || 10,
        condition: {
          isActive: filter?.isActive,
          group: filter?.group,
          $OR: filter?.searchText
            ? [
                { brandName: { LIKE: filter?.searchText } },
                { substance: { LIKE: filter?.searchText } },
              ]
            : undefined,
          quantity: filter?.quantity,
          deletedAt: { IS_NULL: true },
        },
        sort: sort || { id: 'DESC' },
      })
      const productList = Product.fromList(productPagination.data)

      if (relation?.batchList) {
        // TODO
        // const productIdList = productList.map((i) => i.id)
        // const batchObjects = await BatchDB.findManyBy({
        //   productId: { IN: productIdList },
        //   quantity: filter?.batches?.quantity,
        //   expiryDate: filter?.batches?.expiryDate,
        // })
        // const batchList = Batch.fromList(batchObjects)
        // const productBatchMap = arrayToKeyArray(batchList, 'productId')
        // productList.forEach((i) => {
        //   i.batches = productBatchMap[i.id] || []
        //   i.batches.forEach((b) => (b.product = i))
        // })
      }

      return {
        data: productList,
        page,
        limit,
        total: productPagination.total,
      }
    },

    async list(params: ProductListQuery) {
      const { filter, limit, sort } = params
      const objects = await ProductDB.findMany({
        limit,
        condition: {
          id: filter?.id,
          isActive: filter?.isActive,
          group: filter?.group,
          quantity: filter?.quantity,
        },
        sort,
      })
      return Product.fromList(objects)
    },

    async getOne(id: number) {
      const product = await ProductDB.findOneByKey(id)
      return product ? Product.from(product) : null
    },

    async createOne(instance: Product) {
      const response = await ProductApi.createOne(instance)
      await ProductDB.upsertOne(response)
      this.timeSync = Date.now()
      return response
    },

    async updateOne(id: number, instance: Product) {
      const response = await ProductApi.updateOne(id, instance)
      await ProductDB.replaceOne(id, response)
      this.timeSync = Date.now()
      return response
    },

    async deleteOne(id: number) {
      const response = await ProductApi.deleteOne(id)
      await ProductDB.replaceOne(id, response)
      this.timeSync = Date.now()
      return response
    },

    async search(text: string) {
      if (!text) return []
      const objects = await ProductDB.findManyBy({
        $OR: [{ brandName: { LIKE: text } }, { substance: { LIKE: text } }],
        isActive: 1,
        deletedAt: { IS_NULL: true },
      })
      return Product.fromList(objects)
    },
  },
})
