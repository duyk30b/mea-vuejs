import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import {
  CustomerSourceDetailQuery,
  CustomerSourceGetQuery,
  type CustomerSourceListQuery,
  type CustomerSourcePaginationQuery,
} from './customer_source.dto'
import { CustomerSource } from './customer_source.model'

export class CustomerSourceApi {
  static async pagination(options: CustomerSourcePaginationQuery) {
    const params = CustomerSourceGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/customer_source/pagination', { params })
    const { data, meta } = response.data as FullResponse

    return {
      customerSourceList: CustomerSource.fromList(data.customerSourceList),
      total: data.total,
      page: data.page,
      limit: data.limit,
    }
  }

  static async list(options: CustomerSourceListQuery) {
    const params = CustomerSourceGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/customer_source/list', { params })
    const { data, time } = response.data as FullResponse<{ customerSourceList: any[] }>
    return CustomerSource.fromList(data.customerSourceList)
  }

  static async detail(
    id: number,
    options: CustomerSourceDetailQuery = {},
  ): Promise<CustomerSource> {
    const params = CustomerSourceGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/customer_source/detail/${id}`, { params })
    const { data, meta } = response.data as FullResponse<{ customerSource: any }>
    return CustomerSource.from(data.customerSource)
  }

  static async createOne(customerSource: CustomerSource) {
    const response = await AxiosInstance.post('/customer_source/create', {
      name: customerSource.name,
    })
    const { data } = response.data as FullResponse<{ customerSource: any }>
    return CustomerSource.from(data.customerSource)
  }

  static async updateOne(id: number, customerSource: CustomerSource) {
    const response = await AxiosInstance.post(`/customer_source/update/${id}`, {
      name: customerSource.name,
    })
    const { data } = response.data as FullResponse<{ customerSource: any }>
    return CustomerSource.from(data.customerSource)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.post(`/customer_source/destroy/${id}`)
    const { data, meta } = response.data as FullResponse<{ customerSourceId: number }>
    return data.customerSourceId
  }
}
