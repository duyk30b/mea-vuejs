import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { ParaclinicalGroupApi } from './paraclinical-group.api'
import type { ParaclinicalGroup } from './paraclinical-group.model'

export class ParaclinicalGroupService {
  static timeSync: string = ''
  static paraclinicalGroupAll: ParaclinicalGroup[]

  static async getAll() {
    let refreshTime = await RefreshTimeDB.findOneByCode('PARACLINICAL_GROUP')
    if (!refreshTime) {
      refreshTime = {
        code: 'PARACLINICAL_GROUP',
        dataVersion: 0,
        time: new Date(0).toISOString(),
      }
    }
    if (refreshTime.time !== ParaclinicalGroupService.timeSync) {
      const now = new Date().toISOString()
      refreshTime.time = now
      ParaclinicalGroupService.timeSync = now
      const fetchData = await ParaclinicalGroupApi.list({})
      ParaclinicalGroupService.paraclinicalGroupAll = fetchData.data
      await RefreshTimeDB.upsertOne(refreshTime)
    }

    return ParaclinicalGroupService.paraclinicalGroupAll
  }

  static async updateTimeSyncDB() {
    let refreshTime = await RefreshTimeDB.findOneByCode('PARACLINICAL_GROUP')
    if (!refreshTime) {
      refreshTime = {
        code: 'PARACLINICAL_GROUP',
        dataVersion: 0,
        time: '',
      }
    }
    refreshTime.time = new Date().toISOString()
    await RefreshTimeDB.upsertOne(refreshTime)
  }

  static async createOne(paraclinicalGroup: ParaclinicalGroup) {
    await ParaclinicalGroupService.updateTimeSyncDB()
    return await ParaclinicalGroupApi.createOne(paraclinicalGroup)
  }

  static async updateOne(id: number, paraclinicalGroup: ParaclinicalGroup) {
    await ParaclinicalGroupService.updateTimeSyncDB()
    return await ParaclinicalGroupApi.updateOne(id, paraclinicalGroup)
  }

  static async destroyOne(id: number) {
    await ParaclinicalGroupService.updateTimeSyncDB()
    return await ParaclinicalGroupApi.destroyOne(id)
  }
}
