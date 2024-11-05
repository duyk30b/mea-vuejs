import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  RadiologyGroupDetailQuery,
  RadiologyGroupGetQuery,
  type RadiologyGroupListQuery,
  type RadiologyGroupPaginationQuery,
} from './radiology-group.dto'
import { RadiologyGroup } from './radiology-group.model'

export class RadiologyGroupApi {
  static async pagination(options: RadiologyGroupPaginationQuery) {
    const params = RadiologyGroupGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/radiology-group/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: RadiologyGroup.fromList(data),
    }
  }

  static async list(options: RadiologyGroupListQuery) {
    const params = RadiologyGroupGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/radiology-group/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: RadiologyGroup.fromList(data),
    }
  }

  static async detail(id: number, options: RadiologyGroupDetailQuery = {}): Promise<RadiologyGroup> {
    const params = RadiologyGroupGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/radiology-group/detail/${id}`, { params })
    const { data, meta } = response.data as BaseResponse
    return RadiologyGroup.from(data)
  }

  static async createOne(customerSource: RadiologyGroup) {
    const response = await AxiosInstance.post('/radiology-group/create', {
      name: customerSource.name,
    })
    const { data } = response.data as BaseResponse
    return RadiologyGroup.from(data)
  }

  static async updateOne(id: number, customerSource: RadiologyGroup) {
    const response = await AxiosInstance.patch(`/radiology-group/update/${id}`, {
      name: customerSource.name,
    })
    const { data } = response.data as BaseResponse
    return RadiologyGroup.from(data)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.delete(`/radiology-group/destroy/${id}`)
    const { data, meta } = response.data as BaseResponse
    return RadiologyGroup.from(data)
  }
}
