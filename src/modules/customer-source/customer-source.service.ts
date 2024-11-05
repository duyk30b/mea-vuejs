import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { CustomerSourceApi } from './customer-source.api'
import type { CustomerSource } from './customer-source.model'

export class CustomerSourceService {
  static timeSync: string = ''
  static customerSourceAll: CustomerSource[]

  static async getAll() {
    let refreshTime = await RefreshTimeDB.findOneByCode('CUSTOMER_SOURCE')
    if (!refreshTime) {
      refreshTime = {
        code: 'CUSTOMER_SOURCE',
        dataVersion: 0,
        time: new Date(0).toISOString(),
      }
    }
    if (refreshTime.time !== CustomerSourceService.timeSync) {
      const now = new Date().toISOString()
      refreshTime.time = now
      CustomerSourceService.timeSync = now
      const fetchData = await CustomerSourceApi.list({})
      CustomerSourceService.customerSourceAll = fetchData.data
      await RefreshTimeDB.upsertOne(refreshTime)
    }

    return CustomerSourceService.customerSourceAll
  }

  static async updateTimeSyncDB() {
    let refreshTime = await RefreshTimeDB.findOneByCode('CUSTOMER_SOURCE')
    if (!refreshTime) {
      refreshTime = {
        code: 'CUSTOMER_SOURCE',
        dataVersion: 0,
        time: '',
      }
    }
    refreshTime.time = new Date().toISOString()
    await RefreshTimeDB.upsertOne(refreshTime)
  }

  static async createOne(customerSource: CustomerSource) {
    await CustomerSourceService.updateTimeSyncDB()
    return await CustomerSourceApi.createOne(customerSource)
  }

  static async updateOne(id: number, customerSource: CustomerSource) {
    await CustomerSourceService.updateTimeSyncDB()
    return await CustomerSourceApi.updateOne(id, customerSource)
  }

  static async destroyOne(id: number) {
    await CustomerSourceService.updateTimeSyncDB()
    return await CustomerSourceApi.destroyOne(id)
  }
}
