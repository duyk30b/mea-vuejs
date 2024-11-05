import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { ProductGroupApi } from './product-group.api'
import type { ProductGroup } from './product-group.model'

export class ProductGroupService {
  static timeSync: string = ''
  static customerSourceAll: ProductGroup[]

  static async getAll() {
    let refreshTime = await RefreshTimeDB.findOneByCode('PRODUCT_GROUP')
    if (!refreshTime) {
      refreshTime = {
        code: 'PRODUCT_GROUP',
        dataVersion: 0,
        time: new Date(0).toISOString(),
      }
    }
    if (refreshTime.time !== ProductGroupService.timeSync) {
      const now = new Date().toISOString()
      refreshTime.time = now
      ProductGroupService.timeSync = now
      const fetchData = await ProductGroupApi.list({})
      ProductGroupService.customerSourceAll = fetchData.data
      await RefreshTimeDB.upsertOne(refreshTime)
    }

    return ProductGroupService.customerSourceAll
  }

  static async updateTimeSyncDB() {
    let refreshTime = await RefreshTimeDB.findOneByCode('PRODUCT_GROUP')
    if (!refreshTime) {
      refreshTime = {
        code: 'PRODUCT_GROUP',
        dataVersion: 0,
        time: '',
      }
    }
    refreshTime.time = new Date().toISOString()
    await RefreshTimeDB.upsertOne(refreshTime)
  }

  static async createOne(customerSource: ProductGroup) {
    await ProductGroupService.updateTimeSyncDB()
    return await ProductGroupApi.createOne(customerSource)
  }

  static async updateOne(id: number, customerSource: ProductGroup) {
    await ProductGroupService.updateTimeSyncDB()
    return await ProductGroupApi.updateOne(id, customerSource)
  }

  static async destroyOne(id: number) {
    await ProductGroupService.updateTimeSyncDB()
    return await ProductGroupApi.destroyOne(id)
  }
}
