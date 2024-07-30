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

  static async detail(
    id: number,
    options: RadiologyGroupDetailQuery = {}
  ): Promise<RadiologyGroup> {
    const params = RadiologyGroupGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/radiology-group/detail/${id}`, { params })
    const { data, meta } = response.data as BaseResponse<{ radiologyGroup: any }>
    return RadiologyGroup.from(data.radiologyGroup)
  }

  static async createOne(radiologyGroup: RadiologyGroup) {
    const response = await AxiosInstance.post('/radiology-group/create', {
      name: radiologyGroup.name,
    })
    const { data } = response.data as BaseResponse<{ radiologyGroup: any }>
    return RadiologyGroup.from(data.radiologyGroup)
  }

  static async updateOne(id: number, radiologyGroup: RadiologyGroup) {
    const response = await AxiosInstance.patch(`/radiology-group/update/${id}`, {
      name: radiologyGroup.name,
    })
    const { data } = response.data as BaseResponse<{ radiologyGroup: any }>
    return RadiologyGroup.from(data.radiologyGroup)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.delete(`/radiology-group/destroy/${id}`)
    const { data, meta } = response.data as BaseResponse<boolean>
    return data
  }

  static async replaceAll(body: RadiologyGroup[]) {
    const response = await AxiosInstance.put('/radiology-group/replace-all', {
      radiologyGroupReplaceAll: body.map((i) => {
        return {
          id: i.id || 0,
          name: i.name,
        }
      }),
    })
    const { data } = response.data as BaseResponse
    return data
  }

  static async systemList() {
    const response = await AxiosInstance.get('/radiology-group/system-list')
    const { data, time } = response.data as BaseResponse
    return RadiologyGroup.fromList(data)
  }
}
