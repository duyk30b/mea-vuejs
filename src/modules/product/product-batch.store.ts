import { defineStore } from 'pinia'
import type { ProductBatch } from './product-batch.model'
import { ProductBatchService, type ProductBatchPaginationQuery } from './product-batch.service'
import { customFilter } from '@/utils'
import type { Product } from './product.model'

export const useProductBatchStore = defineStore('product-batch-store', {
  state: () => {
    return { productBatchList: [] as ProductBatch[] }
  },

  actions: {
    async fetchAll() {
      try {
        this.productBatchList = await ProductBatchService.list({
          filter: { quantity_zero: 'false' },
          relation: { product: true },
        })
      } catch (error) {
        console.log('🚀 ~ file: product-batch.store.ts:16 ~ fetchAll ~ error:', error)
      }
    },
    updateOne(id: number, productBatch: ProductBatch) {
      const index = this.productBatchList.findIndex((i) => i.id === id)
      if (index === -1) return
      this.productBatchList[index] = productBatch
    },
    updateProduct(product: Product) {
      this.productBatchList.forEach((batch) => {
        if (batch.productId === product.id) {
          batch.product = product
        }
      })
    },
  },

  getters: {
    productBatchMap: (state) => {
      const productBatchMap: Record<string, ProductBatch[]> = {}
      state.productBatchList.forEach((batch) => {
        if (!productBatchMap[batch.productId]) {
          productBatchMap[batch.productId] = []
        }
        productBatchMap[batch.productId].push(batch)
      })
      return productBatchMap
    },
    pagination: (state) => {
      return (params: ProductBatchPaginationQuery) => {
        const { filter, sort, page, limit } = params
        const response = state.productBatchList.filter((productBatch) => {
          if (filter?.is_active && String(productBatch.product?.isActive) !== filter?.is_active) {
            return false
          }
          if (filter?.group && productBatch.product?.group !== filter?.group) {
            return false
          }
          if (filter?.search_text) {
            if (!customFilter(productBatch.product?.brandName || '', filter?.search_text, 2)
              && !customFilter(productBatch.product?.substance || '', filter?.search_text, 2)) {
              return false
            }
          }
          return true
        })
        response.sort((a, b) => {
          if (sort?.expiry_date) {
            if (sort?.expiry_date === 'ASC') return (a.expiryDate || 0) < (b.expiryDate || 0) ? -1 : 1
            if (sort?.expiry_date === 'DESC') return (a.expiryDate || 0) > (b.expiryDate || 0) ? -1 : 1
          }
          return a.id > b.id ? -1 : 1
        })

        const start = (page - 1) * limit
        const end = page * limit
        return {
          total: response.length,
          page: params.page,
          limit: params.limit,
          data: response.slice(start, end),
        }
      }
    },
  },
})