import { AxiosInstance } from '@/core/axios.instance'
import type { ApiPaginationRequest, ApiPaginationResponse } from '../pagination'
import { Distributor } from './distributor.model'
import { debounceAsync } from '@/utils/helpers'

export interface DistributorFilterQuery {
  isActive?: 1 | 0
  searchText?: string
}
export interface DistributorPaginationQuery extends ApiPaginationRequest {
  filter?: DistributorFilterQuery
  sort?: {
    id?: 'ASC' | 'DESC'
    debt?: 'ASC' | 'DESC'
    fullName?: 'ASC' | 'DESC'
  }
}

export type DistributorListQuery = {
  limit?: number
  filter?: DistributorFilterQuery
}

export class DistributorService {
  static async pagination(params: DistributorPaginationQuery) {
    const response = await AxiosInstance.get('/distributor/pagination', { params })
    const data = response.data as ApiPaginationResponse
    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      data: Distributor.fromPlains(data.data),
    }
  }

  static async list(params: DistributorListQuery): Promise<Distributor[]> {
    const { data } = await AxiosInstance.get('/distributor/list', { params })
    return Distributor.fromPlains(data)
  }

  static search = debounceAsync(async (text: string): Promise<Distributor[]> => {
    const filter: DistributorFilterQuery = {
      isActive: 1,
      searchText: text,
    }
    // if (/^\d+$/.test(text)) { } // text search phone
    const response = await AxiosInstance.get('/distributor/list', {
      params: {
        filter,
        limit: 10,
      },
    })
    return Distributor.fromPlains(response.data)
  }, 200)

  static async getOne(id: number): Promise<Distributor> {
    const { data } = await AxiosInstance.get(`/distributor/detail/${id}`)
    return Distributor.fromPlain(data)
  }

  static async createOne(distributor: Distributor) {
    const distributorDto = Distributor.toPlain(distributor)
    const { data } = await AxiosInstance.post('/distributor/create', distributorDto)
    return Distributor.fromPlain(data)
  }

  static async updateOne(id: number, distributor: Distributor) {
    const distributorDto = Distributor.toPlain(distributor)
    const { data } = await AxiosInstance.patch(`/distributor/update/${id}`, distributorDto)
    return Distributor.fromPlain(data)
  }
}
