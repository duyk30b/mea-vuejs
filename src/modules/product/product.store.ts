import { customFilter } from '@/utils'
import { defineStore } from 'pinia'
import type { Product } from './product.model'
import { ProductService, type ProductPaginationQuery } from './product.service'
import type { ProductBatch } from './product-batch.model'

export const useProductStore = defineStore('product-store', {
  state: () => {
    return { productList: [] as Product[] }
  },

  actions: {
    async fetchAll() {
      try {
        this.productList = await ProductService.list({ relation: { product_batches: true } })
      } catch (error) {
        console.log('🚀 ~ file: product.store.ts:16 ~ fetchAll ~ error:', error)
      }
    },
    updateOne(id: number, data: Partial<Product>) {
      const index = this.productList.findIndex((i) => i.id === id)
      if (index !== -1) {
        Object.assign(this.productList[index], data)
      }
    },
    createOne(product: Product) {
      this.productList.unshift(product)
    },
    updateProductBatch(productId: number, data: ProductBatch) {
      const product = this.productList.find((i) => i.id === productId)
      if (!product) return
      const index = product!.productBatches.findIndex((i) => i.id === data.id)
      if (index === -1) return
      product!.productBatches[index] = data
    },
  },

  getters: {
    pagination: (state) => {
      return (params: ProductPaginationQuery) => {
        const { filter, sort, page, limit } = params
        const response = state.productList.filter((product) => {
          if (filter?.is_active && String(product.isActive) !== filter?.is_active) {
            return false
          }
          if (filter?.group && product.group !== filter?.group) {
            return false
          }
          if (filter?.search_text) {
            if (!customFilter(product.brandName, filter?.search_text, 2)
              && !customFilter((product.substance || ''), filter?.search_text, 2)) {
              return false
            }
          }
          return true
        })
        response.sort((a, b) => {
          if (sort?.id) {
            if (sort?.id === 'ASC') return a.id < b.id ? -1 : 1
            if (sort?.id === 'DESC') return a.id > b.id ? -1 : 1
          }
          if (sort?.brand_name) {
            if (sort?.brand_name === 'ASC') return a.brandName < b.brandName ? -1 : 1
            if (sort?.brand_name === 'DESC') return a.brandName > b.brandName ? -1 : 1
          }
          if (sort?.quantity) {
            if (sort?.quantity === 'ASC') return a.quantity < b.quantity ? -1 : 1
            if (sort?.quantity === 'DESC') return a.quantity > b.quantity ? -1 : 1
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
    search: (state) => {
      return (text: string) => {
        return state.productList.filter((item) => {
          if (!item.isActive) return false
          if (!customFilter(item.brandName, text, 2)
            && !customFilter((item.substance || ''), text, 2)) {
            return false
          }
          return true
        })
      }
    },
  },
})