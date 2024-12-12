import { arrayToKeyValue } from '../../utils'
import { WarehouseApi } from './warehouse.api'
import type {
  WarehouseDetailQuery,
  WarehouseGetQuery,
  WarehouseListQuery,
  WarehousePaginationQuery,
} from './warehouse.dto'
import { Warehouse } from './warehouse.model'

export class WarehouseService {
  static loadedAll: boolean = false
  static warehouseAll: Warehouse[] = []

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng loadedAll
  static getAll = (() => {
    const start = async () => {
      try {
        const { data } = await WarehouseApi.list({})
        WarehouseService.warehouseAll = data
      } catch (error: any) {
        console.log('🚀 ~ file: warehouse.service.ts:20 ~ WarehouseService ~ start ~ error:', error)
      }
    }
    let fetching: any = null
    return async (options: { refresh?: boolean } = {}) => {
      if (!fetching || !WarehouseService.loadedAll || options.refresh) {
        WarehouseService.loadedAll = true
        fetching = start()
      }
      await fetching
    }
  })()

  private static executeQuery(all: Warehouse[], query: WarehouseGetQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        return true
      })
    }
    if (query.sort) {
      if (query.sort.id) {
        data.sort((a, b) => {
          if (query.sort?.id === 'ASC') return a.id < b.id ? -1 : 1
          if (query.sort?.id === 'DESC') return a.id > b.id ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      }
    }
    return data
  }

  static async getMap() {
    await WarehouseService.getAll()
    return arrayToKeyValue(WarehouseService.warehouseAll, 'id')
  }

  static async pagination(options: WarehousePaginationQuery) {
    const page = options.page || 1
    const limit = options.limit || 10
    await WarehouseService.getAll({ refresh: true })

    let data = WarehouseService.executeQuery(WarehouseService.warehouseAll, options)
    data = data.slice((page - 1) * limit, page * limit)
    return {
      data: Warehouse.fromList(data),
      meta: { total: WarehouseService.warehouseAll.length },
    }
  }

  static async list(options: WarehouseListQuery) {
    await WarehouseService.getAll()
    const data = WarehouseService.executeQuery(WarehouseService.warehouseAll, options)
    return Warehouse.fromList(data)
  }

  static async detail(id: number, options: WarehouseDetailQuery = {}) {
    const warehouse = await WarehouseApi.detail(id, options)
    if (warehouse) {
      const findIndex = WarehouseService.warehouseAll.findIndex((i) => i.id === id)
      if (findIndex !== -1) {
        WarehouseService.warehouseAll[findIndex] = warehouse
      }
    }
    return warehouse
  }

  static async createOne(warehouse: Warehouse) {
    const result = await WarehouseApi.createOne(warehouse)
    WarehouseService.loadedAll = false
    return result
  }

  static async updateOne(id: number, warehouse: Warehouse) {
    const result = await WarehouseApi.updateOne(id, warehouse)
    WarehouseService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await WarehouseApi.destroyOne(id)
    if (result.success) {
      WarehouseService.loadedAll = false
    }
    return result
  }
}
