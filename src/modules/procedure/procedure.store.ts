import { defineStore } from 'pinia'
import { ProcedureDB } from '../../core/indexed-db/repository/procedure.repository'
import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { ProcedureApi } from './procedure.api'
import type { ProcedurePaginationQuery } from './procedure.dto'
import type { Procedure } from './procedure.model'

export const useProcedureStore = defineStore('procedure-store', {
  state: () => {
    return { procedureList: [] as Procedure[] }
  },

  actions: {
    async refreshDB() {
      try {
        let refreshTime = await RefreshTimeDB.getOneByCode('PROCEDURE')
        if (!refreshTime) {
          refreshTime = { code: 'PROCEDURE', time: new Date(0).toISOString() }
        }
        const lastTime = new Date(refreshTime.time)
        const currentTime = new Date()
        const customerList = await ProcedureApi.list({
          filter: { updatedAt: { GTE: lastTime, LT: currentTime } },
        })
        if (customerList.length) {
          await ProcedureDB.upsertMany(customerList)
        }

        refreshTime.time = currentTime.toISOString()
        await RefreshTimeDB.upsertOne(refreshTime)
      } catch (error) {
        console.log('🚀 ~ file: customer.store.ts:33 ~ refreshDB ~ error:', error)
      }
    },

    async pagination(params: ProcedurePaginationQuery) {
      return await ProcedureDB.pagination(params)
    },

    async createOne(customer: Procedure) {
      const response = await ProcedureApi.createOne(customer)
      await ProcedureDB.insertOne(response)
      return response
    },

    async updateOne(id: number, data: Procedure) {
      const response = await ProcedureApi.updateOne(id, data)
      await ProcedureDB.updateOne(response)
      return response
    },

    async deleteOne(id: number) {
      await ProcedureApi.deleteOne(id)
      await ProcedureDB.deleteOneById(id)
    },

    async search(text: string) {
      return await ProcedureDB.search(text)
    },
  },
})
