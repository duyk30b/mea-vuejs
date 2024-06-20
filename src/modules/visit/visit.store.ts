import { defineStore } from 'pinia'
import { VisitApi, type Visit } from '.'

export const useVisitStore = defineStore('visit-store', {
  state: () => {
    return {
      visitList: <Visit[]>[],
      paginationMeta: {
        total: 0,
        limit: Number(localStorage.getItem('INVOICE_PAGINATION_LIMIT')) || 10,
        page: 1,
      },
      visitHistory: <Record<string, Visit>>{},
    }
  },

  actions: {
    async getVisitHistoryByBasic(visit: Visit) {
      if (
        !this.visitHistory[visit.id] ||
        this.visitHistory[visit.id].updatedAt !== visit.updatedAt
      ) {
        this.visitHistory[visit.id] = await VisitApi.detail(visit.id, {
          relation: {
            customer: true,
            visitDiagnosis: true,
            visitProductList: true,
            visitProcedureList: true,
          },
        })
      }
      return this.visitHistory[visit.id]
    },
  },
})
