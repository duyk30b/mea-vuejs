import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  SurchargeDetailQuery,
  SurchargeGetQuery,
  type SurchargeListQuery,
  type SurchargePaginationQuery,
} from './surcharge.dto'
import { Surcharge } from './surcharge.model'

export class SurchargeApi {
  static async pagination(options: SurchargePaginationQuery) {
    const params = SurchargeGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/surcharge/pagination', { params })
    const { data, meta } = response.data as BaseResponse
  }

  static async list(options: SurchargeListQuery) {
    const params = SurchargeGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/surcharge/list', { params })
    const { data, time } = response.data as BaseResponse<{ surchargeList: any[] }>
    return Surcharge.fromList(data.surchargeList)
  }

  static async detail(id: number, options: SurchargeDetailQuery = {}): Promise<Surcharge> {
    const params = SurchargeGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/surcharge/detail/${id}`, { params })
    const { data, meta } = response.data as BaseResponse<{ surcharge: any }>
    return Surcharge.from(data.surcharge)
  }

  static async createOne(surcharge: Surcharge) {
    const response = await AxiosInstance.post('/surcharge/create', {
      code: surcharge.code,
      name: surcharge.name,
      isActive: surcharge.isActive,
    })
    const { data } = response.data as BaseResponse<{ surcharge: any }>
    return Surcharge.from(data.surcharge)
  }

  static async updateOne(id: number, surcharge: Partial<Surcharge>) {
    const response = await AxiosInstance.patch(`/surcharge/update/${id}`, {
      code: surcharge.code,
      name: surcharge.name,
      isActive: surcharge.isActive,
    })
    const { data } = response.data as BaseResponse<{ surcharge: any }>
    return Surcharge.from(data.surcharge)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.delete(`/surcharge/destroy/${id}`)
    const result = response.data as BaseResponse<{ surchargeId: number }>
    return result
  }
}
