import { defineStore } from 'pinia'
import { ProductBatchDB } from '../../core/indexed-db/repository/product-batch.repository copy'
import { ProductDB } from '../../core/indexed-db/repository/product.repository'
import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { arrayToKeyArray } from '../../utils'
import { ProductBatch } from '../product-batch'
import { ProductApi } from './product.api'
import type { ProductPaginationQuery } from './product.dto'
import { Product } from './product.model'

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
        refreshTime = { code: 'PRODUCT', time: new Date(0).toISOString() }
      }
      const lastTime = new Date(refreshTime.time)
      const { data, time } = await ProductApi.list({
        filter: { updatedAt: { GTE: lastTime } },
      })
      if (data.length) {
        await ProductDB.upsertMany(data)
        refreshTime.time = time.toISOString()
        await RefreshTimeDB.upsertOne(refreshTime)
      }

      return data
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
      const productList = Product.fromObjects(productPagination.data)

      if (relation?.productBatches) {
        const productIdList = productList.map((i) => i.id)
        const productBatchObjects = await ProductBatchDB.findManyBy({
          productId: { IN: productIdList },
          quantity: filter?.productBatch?.quantity,
          expiryDate: filter?.productBatch?.expiryDate,
          deletedAt: { IS_NULL: true },
        })
        const productBatchList = ProductBatch.fromObjects(productBatchObjects)
        const productBatchMap = arrayToKeyArray(productBatchList, 'productId')
        productList.forEach((i) => {
          i.productBatches = productBatchMap[i.id] || []
          i.productBatches.forEach((b) => (b.product = i))
        })
      }

      return {
        data: productList,
        page,
        limit,
        total: productPagination.total,
      }
    },

    async createOne(instance: Product) {
      const response = await ProductApi.createOne(instance)
      await ProductDB.insertOne(response)
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
      return Product.fromObjects(objects)
    },
  },
})
