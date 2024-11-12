import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  ParaclinicalGroupDetailQuery,
  ParaclinicalGroupGetQuery,
  type ParaclinicalGroupListQuery,
  type ParaclinicalGroupPaginationQuery,
} from './paraclinical-group.dto'
import { ParaclinicalGroup } from './paraclinical-group.model'

export class ParaclinicalGroupApi {
  static async pagination(options: ParaclinicalGroupPaginationQuery) {
    const params = ParaclinicalGroupGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/paraclinical-group/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: ParaclinicalGroup.fromList(data),
    }
  }

  static async list(options: ParaclinicalGroupListQuery) {
    const params = ParaclinicalGroupGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/paraclinical-group/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: ParaclinicalGroup.fromList(data),
    }
  }

  static async detail(id: number, options: ParaclinicalGroupDetailQuery = {}): Promise<ParaclinicalGroup> {
    const params = ParaclinicalGroupGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/paraclinical-group/detail/${id}`, { params })
    const { data, meta } = response.data as BaseResponse
    return ParaclinicalGroup.from(data)
  }

  static async createOne(paraclinicalGroup: ParaclinicalGroup) {
    const response = await AxiosInstance.post('/paraclinical-group/create', {
      name: paraclinicalGroup.name,
    })
    const { data } = response.data as BaseResponse
    return ParaclinicalGroup.from(data)
  }

  static async updateOne(id: number, paraclinicalGroup: ParaclinicalGroup) {
    const response = await AxiosInstance.patch(`/paraclinical-group/update/${id}`, {
      name: paraclinicalGroup.name,
    })
    const { data } = response.data as BaseResponse
    return ParaclinicalGroup.from(data)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.delete(`/paraclinical-group/destroy/${id}`)
    const { data, meta } = response.data as BaseResponse
    return ParaclinicalGroup.from(data)
  }
}
