import { defineStore } from 'pinia'
import { ProductBatchDB } from '../../core/indexed-db/repository/product-batch.repository copy'
import { ProductDB } from '../../core/indexed-db/repository/product.repository'
import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { objectKeyByArray } from '../../utils'
import { Product } from '../product/product.model'
import { ProductBatchApi } from './product-batch.api'
import type { ProductBatchListQuery, ProductBatchPaginationQuery } from './product-batch.dto'
import { ProductBatch } from './product-batch.model'

export const useProductBatchStore = defineStore('product-batch-store', {
  state: () => {
    return {
      timeSync: Date.now(),
    }
  },

  actions: {
    async refreshDB() {
      try {
        let refreshTime = await RefreshTimeDB.findOneByCode('PRODUCT_BATCH')
        if (!refreshTime) {
          refreshTime = { code: 'PRODUCT_BATCH', time: new Date(0).toISOString() }
        }
        const lastTime = new Date(refreshTime.time)
        const currentTime = new Date()
        const productBatchList = await ProductBatchApi.list({
          filter: { updatedAt: { GTE: lastTime, LT: currentTime } },
        })
        if (productBatchList.length) {
          await ProductBatchDB.upsertMany(productBatchList)
        }

        refreshTime.time = currentTime.toISOString()
        await RefreshTimeDB.upsertOne(refreshTime)

        return productBatchList
      } catch (error) {
        console.log('🚀 ~ file: customer.store.ts:33 ~ refreshDB ~ error:', error)
      }
    },

    async pagination(params: ProductBatchPaginationQuery) {
      const { page, limit, relation, filter, sort } = params

      let productIdList: number[] = []
      let productList: Product[] = []
      if (filter?.product || relation?.product) {
        const productObjects = await ProductDB.findManyBy({
          id: filter?.productId,
          isActive: filter?.product?.isActive,
          group: filter?.product?.group,
          $OR: filter?.product?.searchText
            ? [
                { brandName: { LIKE: filter?.product?.searchText } },
                { substance: { LIKE: filter?.product?.searchText } },
              ]
            : undefined,
          quantity: filter?.product?.quantity,
          deletedAt: { IS_NULL: true },
        })

        productList = Product.fromObjects(productObjects)
        productIdList = productList.map((i) => i.id)
      }

      const productBatchPagination = await ProductBatchDB.pagination({
        page: page || 1,
        limit: limit || 10,
        condition: {
          isActive: filter?.isActive,
          expiryDate: filter?.expiryDate,
          quantity: filter?.quantity,
          productId: filter?.product || filter?.productId ? { IN: productIdList } : undefined,
          deletedAt: { IS_NULL: true },
        },
        sort: sort || { id: 'DESC' },
      })

      const productBatchList = ProductBatch.fromObjects(productBatchPagination.data)
      if (relation?.product) {
        const productMap = objectKeyByArray(productList, 'id')
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

    async list(params: ProductBatchListQuery) {
      const { filter, limit, sort } = params
      const objects = await ProductBatchDB.findMany({
        limit,
        condition: {
          isActive: filter?.isActive,
          expiryDate: filter?.expiryDate,
          quantity: filter?.quantity,
          deletedAt: { IS_NULL: true },
          productId: filter?.productId,
        },
        sort,
      })
      return ProductBatch.fromObjects(objects)
    },

    async createOne(instance: ProductBatch) {
      const response = await ProductBatchApi.createOne(instance)
      await ProductBatchDB.insertOne(response)
      this.timeSync = Date.now()
      return response
    },

    async updateOne(id: number, instance: ProductBatch) {
      const response = await ProductBatchApi.updateOne(id, instance)
      await ProductBatchDB.replaceOne(id, response)
      this.timeSync = Date.now()
      return response
    },

    async deleteOne(id: number) {
      const response = await ProductBatchApi.deleteOne(id)
      await ProductBatchDB.replaceOne(id, response)
      this.timeSync = Date.now()
      return response
    },

    async search(text: string) {
      if (!text) return []
      const productObjects = await ProductDB.findManyBy({
        $OR: [{ brandName: { LIKE: text } }, { substance: { LIKE: text } }],
        isActive: 1,
        deletedAt: { IS_NULL: true },
      })
      const productList = Product.fromObjects(productObjects)
      const productIdList = productList.map((i) => i.id)

      const productBatchObjects = await ProductBatchDB.findManyBy({
        isActive: 1,
        productId: { IN: productIdList },
        deletedAt: { IS_NULL: true },
      })
      const productBatchList = ProductBatch.fromObjects(productBatchObjects)
      const productMap = objectKeyByArray(productList, 'id')
      productBatchList.forEach((i) => {
        i.product = productMap[i.productId]
      })

      return productBatchList
    },
  },
})
