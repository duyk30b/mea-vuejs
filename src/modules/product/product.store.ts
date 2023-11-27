import { customFilter } from '@/utils'
import { defineStore } from 'pinia'
import type { ProductBatchPaginationQuery } from './product-batch.dto'
import type { ProductBatch } from './product-batch.model'
import type { ProductPaginationQuery } from './product.dto'
import type { Product } from './product.model'
import { ProductService } from './product.service'

export const useProductStore = defineStore('product-store', {
  state: () => {
    return {
      productList: [] as Product[],
    }
  },

  actions: {
    async fetchAll(options: { relation?: { productBatches?: boolean } }) {
      try {
        this.productList = await ProductService.list({
          filter: {},
          relation: { productBatches: options?.relation?.productBatches },
        })
      } catch (error) {
        console.log('🚀 ~ file: product.store.ts:16 ~ fetchAll ~ error:', error)
      }
    },

    updateProduct(data: Partial<Product>) {
      const index = this.productList.findIndex((i) => i.id === data.id)
      if (index === -1) return
      Object.assign(this.productList[index], data)
    },

    updateProductBatch(data: ProductBatch) {
      const product = this.productList.find((i) => i.id === data.productId)
      if (!product) return
      const index = product.productBatches.findIndex((i) => i.id === data.id)
      if (index === -1) return
      Object.assign(this.productList[index], data)
    },

    createOne(product: Product) {
      this.productList.unshift(product)
    },
  },

  getters: {
    pagination: (state) => {
      return (params: ProductPaginationQuery) => {
        const { filter, sort, page, limit } = params
        const productList = state.productList.filter((product) => {
          if (filter?.isActive != null && product.isActive !== filter?.isActive) {
            return false
          }
          if (filter?.group && product.group !== filter?.group) {
            return false
          }
          if (filter?.searchText) {
            if (
              !customFilter(product.brandName, filter?.searchText, 2) &&
              !customFilter(product.substance || '', filter?.searchText, 2)
            ) {
              return false
            }
          }
          return true
        })

        productList.sort((a, b) => {
          if (sort?.id) {
            if (sort?.id === 'ASC') return a.id < b.id ? -1 : 1
            if (sort?.id === 'DESC') return a.id > b.id ? -1 : 1
          }
          if (sort?.brandName) {
            if (sort?.brandName === 'ASC') return a.brandName < b.brandName ? -1 : 1
            if (sort?.brandName === 'DESC') return a.brandName > b.brandName ? -1 : 1
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
          total: productList.length,
          page: params.page,
          limit: params.limit,
          data: productList.slice(start, end),
        }
      }
    },
    paginationProductBatch: (state) => {
      return (params: ProductBatchPaginationQuery) => {
        const { filter, sort, page, limit } = params
        const productList = state.productList.filter((product) => {
          if (filter?.product?.isActive != null && product.isActive !== filter?.product?.isActive) {
            return false
          }
          if (filter?.product?.group && product.group !== filter?.product?.group) {
            return false
          }
          if (filter?.product?.searchText) {
            if (
              !customFilter(product.brandName || '', filter?.product?.searchText, 2) &&
              !customFilter(product.substance || '', filter?.product?.searchText, 2)
            ) {
              return false
            }
          }
          return true
        })

        const productBatchList = productList
          .map((i) => {
            i.productBatches.forEach((j) => (j.product = i)) // gắn product vào productBatch
            return i.productBatches
          })
          .flat()

        productBatchList.sort((a, b) => {
          if (sort?.expiryDate) {
            if (sort?.expiryDate === 'ASC') return (a.expiryDate || 0) < (b.expiryDate || 0) ? -1 : 1
            if (sort?.expiryDate === 'DESC') return (a.expiryDate || 0) > (b.expiryDate || 0) ? -1 : 1
          }
          return a.id > b.id ? -1 : 1
        })

        const start = (page - 1) * limit
        const end = page * limit
        return {
          total: productBatchList.length,
          page: params.page,
          limit: params.limit,
          data: productBatchList.slice(start, end),
        }
      }
    },

    search: (state) => {
      return (text: string) => {
        return state.productList.filter((item) => {
          if (!item.isActive) return false
          if (!customFilter(item.brandName, text, 2) && !customFilter(item.substance || '', text, 2)) {
            return false
          }
          return true
        })
      }
    },
  },
})
