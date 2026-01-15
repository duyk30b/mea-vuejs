import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import {
  LaboratoryGroupDetailQuery,
  LaboratoryGroupGetQuery,
  type LaboratoryGroupListQuery,
  type LaboratoryGroupPaginationQuery,
} from './laboratory-group.dto'
import { LaboratoryGroup } from './laboratory-group.model'

export class LaboratoryGroupApi {
  static async pagination(options: LaboratoryGroupPaginationQuery) {
    const params = LaboratoryGroupGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/laboratory-group/pagination', { params })
    const { data, meta } = response.data as FullResponse
    return {
      laboratoryGroupList: LaboratoryGroup.fromList(data.laboratoryGroupList),
      total: data.total,
      page: data.page,
      limit: data.limit,
    }
  }

  static async list(options: LaboratoryGroupListQuery) {
    const params = LaboratoryGroupGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/laboratory-group/list', { params })
    const { data, time } = response.data as FullResponse
    return {
      time: new Date(time),
      data: LaboratoryGroup.fromList(data),
    }
  }

  static async detail(
    id: number,
    options: LaboratoryGroupDetailQuery = {},
  ): Promise<LaboratoryGroup> {
    const params = LaboratoryGroupGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/laboratory-group/detail/${id}`, { params })
    const { data, meta } = response.data as FullResponse<{ laboratoryGroup: any }>
    return LaboratoryGroup.from(data.laboratoryGroup)
  }

  static async createOne(laboratoryGroup: LaboratoryGroup) {
    const response = await AxiosInstance.post('/laboratory-group/create', {
      name: laboratoryGroup.name,
      printHtmlId: laboratoryGroup.printHtmlId,
      roomId: laboratoryGroup.roomId,
    })
    const { data } = response.data as FullResponse<{ laboratoryGroup: any }>
    return LaboratoryGroup.from(data.laboratoryGroup)
  }

  static async updateOne(id: number, laboratoryGroup: LaboratoryGroup) {
    const response = await AxiosInstance.post(`/laboratory-group/update/${id}`, {
      name: laboratoryGroup.name,
      printHtmlId: laboratoryGroup.printHtmlId,
      roomId: laboratoryGroup.roomId,
    })
    const { data } = response.data as FullResponse<{ laboratoryGroup: any }>
    return LaboratoryGroup.from(data.laboratoryGroup)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.post(`/laboratory-group/destroy/${id}`)
    const { data, meta } = response.data as FullResponse<boolean>
    return data
  }

  static async replaceAll(body: LaboratoryGroup[]) {
    const response = await AxiosInstance.post('/laboratory-group/replace-all', {
      laboratoryGroupReplaceAll: body.map((i) => {
        return {
          id: i.id || 0,
          name: i.name,
          printHtmlId: i.printHtmlId || 0,
          roomId: i.roomId,
        }
      }),
    })
    const { data } = response.data as FullResponse
    return data
  }

  static async systemList() {
    const response = await AxiosInstance.get('/laboratory-group/system-list')
    const { data, time } = response.data as FullResponse
    return LaboratoryGroup.fromList(data)
  }
}
