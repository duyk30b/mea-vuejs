import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import {
  LaboratorySampleDetailQuery,
  LaboratorySampleGetQuery,
  type LaboratorySampleListQuery,
  type LaboratorySamplePaginationQuery,
} from './laboratory-sample.dto'
import { LaboratorySample } from './laboratory-sample.model'

export class LaboratorySampleApi {
  static async pagination(options: LaboratorySamplePaginationQuery) {
    const params = LaboratorySampleGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/laboratory-sample/pagination', { params })
    const { data, meta } = response.data as FullResponse
    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      laboratorySampleList: LaboratorySample.fromList(data.laboratorySampleList),
    }
  }

  static async list(options: LaboratorySampleListQuery) {
    const params = LaboratorySampleGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/laboratory-sample/list', { params })
    const { data, time } = response.data as FullResponse
    return {
      time: new Date(time),
      data: LaboratorySample.fromList(data),
    }
  }

  static async detail(
    id: number,
    options: LaboratorySampleDetailQuery = {},
  ): Promise<LaboratorySample> {
    const params = LaboratorySampleGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/laboratory-sample/detail/${id}`, { params })
    const { data, meta } = response.data as FullResponse<{ laboratorySample: any }>
    return LaboratorySample.from(data.laboratorySample)
  }

  static async createOne(laboratorySample: LaboratorySample) {
    const response = await AxiosInstance.post('/laboratory-sample/create', {
      priority: laboratorySample.priority,
      name: laboratorySample.name,
      laboratoryIds: laboratorySample.laboratoryIds,
    })
    const { data } = response.data as FullResponse<{ laboratorySample: any }>
    return LaboratorySample.from(data.laboratorySample)
  }

  static async updateOne(id: number, laboratorySample: LaboratorySample) {
    const response = await AxiosInstance.post(`/laboratory-sample/update/${id}`, {
      priority: laboratorySample.priority,
      name: laboratorySample.name,
      laboratoryIds: laboratorySample.laboratoryIds,
    })
    const { data } = response.data as FullResponse<{ laboratorySample: any }>
    return LaboratorySample.from(data.laboratorySample)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.post(`/laboratory-sample/destroy/${id}`)
    const { data, meta } = response.data as FullResponse<boolean>
    return data
  }
}
