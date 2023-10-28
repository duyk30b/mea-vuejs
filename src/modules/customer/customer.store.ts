import { customFilter } from '@/utils'
import { defineStore } from 'pinia'
import type { Customer } from './customer.model'
import { CustomerService, type CustomerPaginationQuery } from './customer.service'

export const useCustomerStore = defineStore('customer-store', {
  state: () => {
    return { customerList: [] as Customer[] }
  },

  actions: {
    async fetchAll() {
      try {
        this.customerList = await CustomerService.list({})
      } catch (error) {
        console.log('🚀 ~ file: customer.store.ts:16 ~ fetchAll ~ error:', error)
      }
    },
    updateOne(id: number, data: Customer) {
      const index = this.customerList.findIndex((i) => i.id === id)
      if (index !== -1) {
        this.customerList[index] = data
      }
    },
    createOne(customer: Customer) {
      this.customerList.unshift(customer)
    },
  },

  getters: {
    pagination: (state) => {
      return (params: CustomerPaginationQuery) => {
        const { filter, sort, page, limit } = params
        const response = state.customerList.filter((customer) => {
          if (filter?.is_active && String(customer.isActive) !== filter?.is_active) {
            return false
          }
          if (filter?.search_text) {
            if (!customFilter(customer.fullName, filter?.search_text, 2)
              && !customFilter((customer.phone || ''), filter?.search_text, 2)) {
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
          if (sort?.debt) {
            if (sort?.debt === 'ASC') return a.debt < b.debt ? -1 : 1
            if (sort?.debt === 'DESC') return a.debt > b.debt ? -1 : 1
          }
          if (sort?.full_name) {
            if (sort?.full_name === 'ASC') return a.fullName < b.fullName ? -1 : 1
            if (sort?.full_name === 'DESC') return a.fullName > b.fullName ? -1 : 1
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
        return state.customerList.filter((item) => {
          if (!item.isActive) return false
          if (!customFilter(item.fullName, text, 2)
            && !customFilter((item.phone || ''), text, 2)) {
            return false
          }
          return true
        })
      }
    },
  },
})