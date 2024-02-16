import { AxiosInstance } from '../../core/axios.instance'
import { debounceAsync } from '../../utils/helpers'
import type { BaseResponse } from '../_base/base-dto'
import type { ApiPaginationResponse } from '../pagination'
import {
  DistributorDetailQuery,
  DistributorGetQuery,
  type DistributorListQuery,
  type DistributorPaginationQuery,
} from './distributor.dto'
import { Distributor } from './distributor.model'

export class DistributorApi {
  static async pagination(options: DistributorPaginationQuery) {
    const params = DistributorGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/distributor/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: Distributor.fromPlains(data),
    }
  }

  static async list(options: DistributorListQuery) {
    const params = DistributorGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/distributor/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: Distributor.fromPlains(data),
    }
  }

  // static search = debounceAsync(async (text: string): Promise<Distributor[]> => {
  //   return await DistributorApi.list({
  //     limit: 10,
  //     filter: { searchText: text, isActive: 1 },
  //   })
  // }, 200)

  static async detail(id: number, options: DistributorDetailQuery = {}): Promise<Distributor> {
    const params = DistributorGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/distributor/detail/${id}`, { params })
    const { data, meta } = response.data as BaseResponse
    return Distributor.fromPlain(data)
  }

  static async createOne(instance: Distributor) {
    const plain = Distributor.toPlain(instance, 'USER_CREATE')
    const response = await AxiosInstance.post('/distributor/create', plain)
    const { data, meta } = response.data as BaseResponse
    return Distributor.fromPlain(data)
  }

  static async updateOne(id: number, instance: Distributor) {
    const plain = Distributor.toPlain(instance, 'USER_UPDATE')
    const response = await AxiosInstance.patch(`/distributor/update/${id}`, plain)
    const { data, meta } = response.data as BaseResponse
    return Distributor.fromPlain(data)
  }

  static async deleteOne(id: number) {
    const response = await AxiosInstance.delete(`/distributor/delete/${id}`)
    const { data, meta } = response.data as BaseResponse
    return Distributor.fromPlain(data)
  }
}
