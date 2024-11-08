import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { ProcedureGroupApi } from './procedure-group.api'
import type { ProcedureGroup } from './procedure-group.model'

export class ProcedureGroupService {
  static timeSync: string = ''
  static procedureGroupAll: ProcedureGroup[]

  static async getAll() {
    let refreshTime = await RefreshTimeDB.findOneByCode('PROCEDURE_GROUP')
    if (!refreshTime) {
      refreshTime = {
        code: 'PROCEDURE_GROUP',
        dataVersion: 0,
        time: new Date(0).toISOString(),
      }
    }
    if (refreshTime.time !== ProcedureGroupService.timeSync) {
      const now = new Date().toISOString()
      refreshTime.time = now
      ProcedureGroupService.timeSync = now
      const fetchData = await ProcedureGroupApi.list({})
      ProcedureGroupService.procedureGroupAll = fetchData.data
      await RefreshTimeDB.upsertOne(refreshTime)
    }

    return ProcedureGroupService.procedureGroupAll
  }

  static async updateTimeSyncDB() {
    let refreshTime = await RefreshTimeDB.findOneByCode('PROCEDURE_GROUP')
    if (!refreshTime) {
      refreshTime = {
        code: 'PROCEDURE_GROUP',
        dataVersion: 0,
        time: '',
      }
    }
    refreshTime.time = new Date().toISOString()
    await RefreshTimeDB.upsertOne(refreshTime)
  }

  static async createOne(procedureGroup: ProcedureGroup) {
    await ProcedureGroupService.updateTimeSyncDB()
    return await ProcedureGroupApi.createOne(procedureGroup)
  }

  static async updateOne(id: number, procedureGroup: ProcedureGroup) {
    await ProcedureGroupService.updateTimeSyncDB()
    return await ProcedureGroupApi.updateOne(id, procedureGroup)
  }

  static async destroyOne(id: number) {
    await ProcedureGroupService.updateTimeSyncDB()
    return await ProcedureGroupApi.destroyOne(id)
  }
}
