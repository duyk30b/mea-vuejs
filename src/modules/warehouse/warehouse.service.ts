import { arrayToKeyValue } from '../../utils'
import { WarehouseApi } from './warehouse.api'
import type {
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
        const warehouseBlank = Warehouse.blank()
        warehouseBlank.name = 'Không chọn kho'
        data.push(warehouseBlank)
        WarehouseService.warehouseAll = data
      } catch (error: any) {
        console.log('🚀 ~ file: warehouse.service.ts:20 ~ WarehouseService ~ start ~ error:', error)
      }
    }
    let fetching: any = null
    return async () => {
      if (!fetching || !WarehouseService.loadedAll) {
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
    await WarehouseService.getAll()

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
