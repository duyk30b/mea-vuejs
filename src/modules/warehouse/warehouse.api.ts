import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
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
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: Warehouse.fromList(data),
    }
  }

  static async list(options: WarehouseListQuery) {
    const params = WarehouseGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/warehouse/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: Warehouse.fromList(data),
    }
  }

  static async detail(id: number, options: WarehouseDetailQuery = {}): Promise<Warehouse> {
    const params = WarehouseGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/warehouse/detail/${id}`, { params })
    const { data, meta } = response.data as BaseResponse
    return Warehouse.from(data)
  }

  static async createOne(warehouse: Warehouse) {
    const response = await AxiosInstance.post('/warehouse/create', {
      name: warehouse.name,
    })
    const { data } = response.data as BaseResponse
    return Warehouse.from(data)
  }

  static async updateOne(id: number, warehouse: Warehouse) {
    const response = await AxiosInstance.patch(`/warehouse/update/${id}`, {
      name: warehouse.name,
    })
    const { data } = response.data as BaseResponse
    return Warehouse.from(data)
  }

  static async deleteOne(id: number) {
    const response = await AxiosInstance.delete(`/warehouse/delete/${id}`)
    const { data, meta } = response.data as BaseResponse
    return Warehouse.from(data)
  }
}
