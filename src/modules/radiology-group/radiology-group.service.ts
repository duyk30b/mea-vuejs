import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { RadiologyGroupApi } from './radiology-group.api'
import type { RadiologyGroup } from './radiology-group.model'

export class RadiologyGroupService {
  static timeSync: string = ''
  static radiologyGroupAll: RadiologyGroup[]

  static async getAll() {
    let refreshTime = await RefreshTimeDB.findOneByCode('RADIOLOGY_GROUP')
    if (!refreshTime) {
      refreshTime = {
        code: 'RADIOLOGY_GROUP',
        dataVersion: 0,
        time: new Date(0).toISOString(),
      }
    }
    if (refreshTime.time !== RadiologyGroupService.timeSync) {
      const now = new Date().toISOString()
      refreshTime.time = now
      RadiologyGroupService.timeSync = now
      const fetchData = await RadiologyGroupApi.list({})
      RadiologyGroupService.radiologyGroupAll = fetchData.data
      await RefreshTimeDB.upsertOne(refreshTime)
    }

    return RadiologyGroupService.radiologyGroupAll
  }

  static async updateTimeSyncDB() {
    let refreshTime = await RefreshTimeDB.findOneByCode('RADIOLOGY_GROUP')
    if (!refreshTime) {
      refreshTime = {
        code: 'RADIOLOGY_GROUP',
        dataVersion: 0,
        time: '',
      }
    }
    refreshTime.time = new Date().toISOString()
    await RefreshTimeDB.upsertOne(refreshTime)
  }

  static async createOne(radiologyGroup: RadiologyGroup) {
    await RadiologyGroupService.updateTimeSyncDB()
    return await RadiologyGroupApi.createOne(radiologyGroup)
  }

  static async updateOne(id: number, radiologyGroup: RadiologyGroup) {
    await RadiologyGroupService.updateTimeSyncDB()
    return await RadiologyGroupApi.updateOne(id, radiologyGroup)
  }

  static async destroyOne(id: number) {
    await RadiologyGroupService.updateTimeSyncDB()
    return await RadiologyGroupApi.destroyOne(id)
  }
}
