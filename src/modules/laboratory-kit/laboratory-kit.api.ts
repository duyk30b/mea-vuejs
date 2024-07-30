import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  LaboratoryKitDetailQuery,
  LaboratoryKitGetQuery,
  type LaboratoryKitListQuery,
  type LaboratoryKitPaginationQuery,
} from './laboratory-kit.dto'
import { LaboratoryKit } from './laboratory-kit.model'

export class LaboratoryKitApi {
  static async pagination(options: LaboratoryKitPaginationQuery) {
    const params = LaboratoryKitGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/laboratory-kit/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: LaboratoryKit.fromList(data),
    }
  }

  static async list(options: LaboratoryKitListQuery) {
    const params = LaboratoryKitGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/laboratory-kit/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: LaboratoryKit.fromList(data),
    }
  }

  static async detail(id: number, options: LaboratoryKitDetailQuery = {}): Promise<LaboratoryKit> {
    const params = LaboratoryKitGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/laboratory-kit/detail/${id}`, { params })
    const { data, meta } = response.data as BaseResponse<{ laboratoryKit: any }>
    return LaboratoryKit.from(data.laboratoryKit)
  }

  static async createOne(laboratoryKit: LaboratoryKit) {
    const response = await AxiosInstance.post('/laboratory-kit/create', {
      priority: laboratoryKit.priority,
      name: laboratoryKit.name,
      laboratoryIds: laboratoryKit.laboratoryIds,
    })
    const { data } = response.data as BaseResponse<{ laboratoryKit: any }>
    return LaboratoryKit.from(data.laboratoryKit)
  }

  static async updateOne(id: number, laboratoryKit: LaboratoryKit) {
    const response = await AxiosInstance.patch(`/laboratory-kit/update/${id}`, {
      priority: laboratoryKit.priority,
      name: laboratoryKit.name,
      laboratoryIds: laboratoryKit.laboratoryIds,
    })
    const { data } = response.data as BaseResponse<{ laboratoryKit: any }>
    return LaboratoryKit.from(data.laboratoryKit)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.delete(`/laboratory-kit/destroy/${id}`)
    const { data, meta } = response.data as BaseResponse<boolean>
    return data
  }
}
