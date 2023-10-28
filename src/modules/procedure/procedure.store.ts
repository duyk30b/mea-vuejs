import { customFilter } from '@/utils'
import { defineStore } from 'pinia'
import type { Procedure } from './procedure.model'
import { ProcedureService, type ProcedurePaginationQuery } from './procedure.service'

export const useProcedureStore = defineStore('procedure-store', {
  state: () => {
    return { procedureList: [] as Procedure[] }
  },

  actions: {
    async fetchAll() {
      try {
        this.procedureList = await ProcedureService.list({})
      } catch (error) {
        console.log('🚀 ~ file: procedure.store.ts:16 ~ fetchAll ~ error:', error)
      }
    },
    updateOne(id: number, data: Procedure) {
      const index = this.procedureList.findIndex((i) => i.id === id)
      if (index !== -1) {
        this.procedureList[index] = data
      }
    },
    createOne(procedure: Procedure) {
      this.procedureList.unshift(procedure)
    },
  },

  getters: {
    pagination: (state) => {
      return (params: ProcedurePaginationQuery) => {
        const { filter, sort, page, limit } = params
        const response = state.procedureList.filter((procedure) => {
          if (filter?.is_active && String(procedure.isActive) !== filter?.is_active) {
            return false
          }
          if (filter?.group && procedure.group !== filter?.group) {
            return false
          }
          if (filter?.search_text) {
            if (!customFilter(procedure.name, filter?.search_text, 2)) {
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
          if (sort?.name) {
            if (sort?.name === 'ASC') return a.name < b.name ? -1 : 1
            if (sort?.name === 'DESC') return a.name > b.name ? -1 : 1
          }
          if (sort?.price) {
            if (sort?.price === 'ASC') return a.price < b.price ? -1 : 1
            if (sort?.price === 'DESC') return a.price > b.price ? -1 : 1
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
        return state.procedureList.filter((item) => {
          if (!item.isActive) return false
          if (!customFilter(item.name, text, 2)) return false
          return true
        })
      }
    },
  },
})