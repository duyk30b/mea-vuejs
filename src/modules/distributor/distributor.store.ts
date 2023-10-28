import { customFilter } from '@/utils'
import { defineStore } from 'pinia'
import type { Distributor } from './distributor.model'
import { DistributorService, type DistributorPaginationQuery } from './distributor.service'

export const useDistributorStore = defineStore('distributor-store', {
  state: () => {
    return { distributorList: [] as Distributor[] }
  },

  actions: {
    async fetchAll() {
      try {
        this.distributorList = await DistributorService.list({})
      } catch (error) {
        console.log('🚀 ~ file: distributor.store.ts:16 ~ fetchAll ~ error:', error)
      }
    },
    updateOne(id: number, data: Distributor) {
      const index = this.distributorList.findIndex((i) => i.id === id)
      if (index !== -1) {
        this.distributorList[index] = data
      }
    },
    createOne(distributor: Distributor) {
      this.distributorList.unshift(distributor)
    },
  },

  getters: {
    pagination: (state) => {
      return (params: DistributorPaginationQuery) => {
        const { filter, sort, page, limit } = params
        const response = state.distributorList.filter((distributor) => {
          if (filter?.is_active && String(distributor.isActive) !== filter?.is_active) {
            return false
          }
          if (filter?.search_text) {
            if (!customFilter(distributor.fullName, filter?.search_text, 2)
              && !customFilter((distributor.phone || ''), filter?.search_text, 2)) {
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
        return state.distributorList.filter((item) => {
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