import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  CustomerSourceDetailQuery,
  CustomerSourceGetQuery,
  type CustomerSourceListQuery,
  type CustomerSourcePaginationQuery,
} from './customer-source.dto'
import { CustomerSource } from './customer-source.model'

export class CustomerSourceApi {
  static async pagination(options: CustomerSourcePaginationQuery) {
    const params = CustomerSourceGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/customer-source/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: CustomerSource.fromList(data),
    }
  }

  static async list(options: CustomerSourceListQuery) {
    const params = CustomerSourceGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/customer-source/list', { params })
    const { data, time } = response.data as BaseResponse
    return CustomerSource.fromList(data)
  }

  static async detail(
    id: number,
    options: CustomerSourceDetailQuery = {}
  ): Promise<CustomerSource> {
    const params = CustomerSourceGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/customer-source/detail/${id}`, { params })
    const { data, meta } = response.data as BaseResponse
    return CustomerSource.from(data)
  }

  static async createOne(customerSource: CustomerSource) {
    const response = await AxiosInstance.post('/customer-source/create', {
      name: customerSource.name,
    })
    const { data } = response.data as BaseResponse
    return CustomerSource.from(data)
  }

  static async updateOne(id: number, customerSource: CustomerSource) {
    const response = await AxiosInstance.post(`/customer-source/update/${id}`, {
      name: customerSource.name,
    })
    const { data } = response.data as BaseResponse
    return CustomerSource.from(data)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.post(`/customer-source/destroy/${id}`)
    const { data, meta } = response.data as BaseResponse
    return CustomerSource.from(data)
  }
}
