import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import {
  WarehouseDetailQuery,
  WarehouseGetQuery,
  type WarehouseListQuery,
  type WarehousePaginationQuery,
} from './warehouse.dto'
import { Warehouse } from './warehouse.model'

export class WarehouseApi {
  static async pagination(options: WarehousePaginationQuery) {
    const params = WarehouseGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/warehouse/pagination', { params })
    const { data, meta } = response.data as FullResponse
    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      warehouseList: Warehouse.fromList(data.warehouseList),
    }
  }

  static async list(options: WarehouseListQuery) {
    const params = WarehouseGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/warehouse/list', { params })
    const { data, time } = response.data as FullResponse
    return {
      time: new Date(time),
      data: Warehouse.fromList(data),
    }
  }

  static async detail(id: number, options: WarehouseDetailQuery = {}): Promise<Warehouse> {
    const params = WarehouseGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/warehouse/detail/${id}`, { params })
    const { data, meta } = response.data as FullResponse<{ warehouse: any }>
    return Warehouse.from(data.warehouse)
  }

  static async createOne(warehouse: Warehouse) {
    const response = await AxiosInstance.post('/warehouse/create', {
      name: warehouse.name,
    })
    const { data } = response.data as FullResponse<{ warehouse: any }>
    return Warehouse.from(data.warehouse)
  }

  static async updateOne(id: number, warehouse: Warehouse) {
    const response = await AxiosInstance.post(`/warehouse/update/${id}`, {
      name: warehouse.name,
    })
    const { data } = response.data as FullResponse<{ warehouse: any }>
    return Warehouse.from(data.warehouse)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.post(`/warehouse/destroy/${id}`)
    const { data } = response.data as FullResponse<{
      warehouseId: number
      countBatch: number
      success: boolean
    }>
    return data
  }
}
