import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
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
    const { data, meta } = response.data as FullResponse
    return {
      radiologyGroupList: RadiologyGroup.fromList(data.radiologyGroupList),
      total: data.total,
      page: data.page,
      limit: data.limit,
    }
  }

  static async list(options: RadiologyGroupListQuery) {
    const params = RadiologyGroupGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/radiology-group/list', { params })
    const { data, time } = response.data as FullResponse
    return {
      time: new Date(time),
      data: RadiologyGroup.fromList(data),
    }
  }

  static async detail(
    id: number,
    options: RadiologyGroupDetailQuery = {},
  ): Promise<RadiologyGroup> {
    const params = RadiologyGroupGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/radiology-group/detail/${id}`, { params })
    const { data, meta } = response.data as FullResponse<{ radiologyGroup: any }>
    return RadiologyGroup.from(data.radiologyGroup)
  }

  static async createOne(radiologyGroup: RadiologyGroup) {
    const response = await AxiosInstance.post('/radiology-group/create', {
      name: radiologyGroup.name,
      roomId: radiologyGroup.roomId,
    })
    const { data } = response.data as FullResponse<{ radiologyGroup: any }>
    return RadiologyGroup.from(data.radiologyGroup)
  }

  static async updateOne(id: number, radiologyGroup: RadiologyGroup) {
    const response = await AxiosInstance.post(`/radiology-group/update/${id}`, {
      name: radiologyGroup.name,
      roomId: radiologyGroup.roomId,
    })
    const { data } = response.data as FullResponse<{ radiologyGroup: any }>
    return RadiologyGroup.from(data.radiologyGroup)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.post(`/radiology-group/destroy/${id}`)
    const { data, meta } = response.data as FullResponse<boolean>
    return data
  }

  static async replaceAll(body: RadiologyGroup[]) {
    const response = await AxiosInstance.post('/radiology-group/replace-all', {
      radiologyGroupReplaceAll: body.map((i) => {
        return {
          id: i.id || 0,
          name: i.name,
          roomId: i.roomId,
        }
      }),
    })
    const { data } = response.data as FullResponse
    return data
  }

  static async systemList() {
    const response = await AxiosInstance.get('/radiology-group/system-list')
    const { data, time } = response.data as FullResponse
    return RadiologyGroup.fromList(data)
  }
}
