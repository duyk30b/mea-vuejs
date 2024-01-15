import { AxiosInstance } from '../../core/axios.instance'
import { debounceAsync } from '../../utils/helpers'
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
    const data = response.data as ApiPaginationResponse
    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      data: Distributor.fromPlains(data.data),
    }
  }

  static async list(options: DistributorListQuery): Promise<Distributor[]> {
    const params = DistributorGetQuery.toQuery(options)

    const { data } = await AxiosInstance.get('/distributor/list', { params })
    return Distributor.fromPlains(data)
  }

  static search = debounceAsync(async (text: string): Promise<Distributor[]> => {
    return await DistributorApi.list({
      limit: 10,
      filter: { searchText: text, isActive: 1 },
    })
  }, 200)

  static async detail(id: number, options: DistributorDetailQuery = {}): Promise<Distributor> {
    const params = DistributorGetQuery.toQuery(options)
    const { data } = await AxiosInstance.get(`/distributor/detail/${id}`, { params })
    return Distributor.fromPlain(data)
  }

  static async createOne(instance: Distributor) {
    const plain = Distributor.toPlain(instance)
    const { data } = await AxiosInstance.post('/distributor/create', plain)

    return Distributor.fromPlain(data)
  }

  static async updateOne(id: number, instance: Distributor) {
    const plain = Distributor.toPlain(instance)
    const { data } = await AxiosInstance.patch(`/distributor/update/${id}`, plain)

    return Distributor.fromPlain(data)
  }

  static async deleteOne(id: number) {
    const { data } = await AxiosInstance.delete(`/distributor/delete/${id}`)

    return Distributor.fromPlain(data)
  }
}
