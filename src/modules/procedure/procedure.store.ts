import { defineStore } from 'pinia'
import { ProcedureDB } from '../../core/indexed-db/repository/procedure.repository'
import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { ProcedureApi } from './procedure.api'
import type { ProcedurePaginationQuery } from './procedure.dto'
import { Procedure } from './procedure.model'
import { useMeStore } from '../_me/me.store'

export const useProcedureStore = defineStore('procedure-store', {
  state: () => {
    return {
      timeSync: Date.now(),
      procedureList: [] as Procedure[],
    }
  },

  actions: {
    async refreshDB() {
      let refreshTime = await RefreshTimeDB.findOneByCode('PROCEDURE')
      if (!refreshTime) {
        refreshTime = {
          code: 'PROCEDURE',
          dataVersion: 0,
          time: new Date(0).toISOString(),
        }
      }
      const dataVersion = useMeStore().organization.dataVersion

      let apiResponse: { time: Date; data: Procedure[] }
      let hasChange = false

      if (refreshTime.dataVersion !== dataVersion) {
        hasChange = true
        await ProcedureDB.truncate()
        apiResponse = await ProcedureApi.list({})
      } else {
        const lastTime = new Date(refreshTime.time)
        apiResponse = await ProcedureApi.list({
          filter: { updatedAt: { GTE: lastTime } },
        })
      }

      if (apiResponse.data.length) {
        await ProcedureDB.upsertMany(apiResponse.data)
      }
      refreshTime.time = apiResponse.time.toISOString()
      refreshTime.dataVersion = dataVersion
      await RefreshTimeDB.upsertOne(refreshTime)

      return {
        hasChange: hasChange || !!apiResponse.data.length,
      }
    },

    async pagination(params: ProcedurePaginationQuery) {
      const result = await ProcedureDB.pagination({
        page: params.page || 1,
        limit: params.limit || 10,
        condition: {
          isActive: params.filter?.isActive,
          group: params.filter?.group,
          name: params.filter?.searchText ? { LIKE: params.filter?.searchText } : undefined,
          deletedAt: { IS_NULL: true },
        },
        sort: params.sort || { id: 'DESC' },
      })
      return {
        total: result.total,
        page: result.page,
        limit: result.limit,
        data: Procedure.fromList(result.data),
      }
    },

    async getOne(id: number) {
      const procedure = await ProcedureDB.findOneByKey(id)
      return procedure ? Procedure.from(procedure) : null
    },

    async createOne(instance: Procedure) {
      const response = await ProcedureApi.createOne(instance)
      await ProcedureDB.upsertOne(response)
      this.timeSync = Date.now()
      return response
    },

    async updateOne(id: number, instance: Procedure) {
      const response = await ProcedureApi.updateOne(id, instance)
      await ProcedureDB.replaceOne(id, response)
      return response
    },

    async deleteOne(id: number) {
      const response = await ProcedureApi.deleteOne(id)
      await ProcedureDB.replaceOne(id, response)
    },

    async search(text: string) {
      if (!text) return []
      const objects = await ProcedureDB.findManyBy({
        isActive: 1,
        name: { LIKE: text },
        deletedAt: { IS_NULL: true },
      })
      return Procedure.fromList(objects as unknown as Procedure[])
    },
  },
})
