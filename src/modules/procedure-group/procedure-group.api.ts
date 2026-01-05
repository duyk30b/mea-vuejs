import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  ProcedureGroupDetailQuery,
  ProcedureGroupGetQuery,
  type ProcedureGroupListQuery,
  type ProcedureGroupPaginationQuery,
} from './procedure-group.dto'
import { ProcedureGroup } from './procedure-group.model'

export class ProcedureGroupApi {
  static async pagination(options: ProcedureGroupPaginationQuery) {
    const params = ProcedureGroupGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/procedure-group/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: ProcedureGroup.fromList(data),
    }
  }

  static async list(options: ProcedureGroupListQuery) {
    const params = ProcedureGroupGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/procedure-group/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: ProcedureGroup.fromList(data),
    }
  }

  static async detail(
    id: number,
    options: ProcedureGroupDetailQuery = {}
  ): Promise<ProcedureGroup> {
    const params = ProcedureGroupGetQuery.toQuery(options)
    const response = await AxiosInstance.get(`/procedure-group/detail/${id}`, { params })
    const { data, meta } = response.data as BaseResponse
    return ProcedureGroup.from(data)
  }

  static async replaceAll(body: ProcedureGroup[]) {
    const response = await AxiosInstance.post('/procedure-group/replace-all', {
      procedureGroupReplaceAll: body.map((i) => {
        return {
          id: i.id || 0,
          name: i.name,
        }
      }),
    })
    const { data } = response.data as BaseResponse
    return data
  }

  static async createOne(procedureGroup: ProcedureGroup) {
    const response = await AxiosInstance.post('/procedure-group/create', {
      name: procedureGroup.name,
    })
    const { data } = response.data as BaseResponse
    return ProcedureGroup.from(data)
  }

  static async updateOne(id: number, procedureGroup: ProcedureGroup) {
    const response = await AxiosInstance.post(`/procedure-group/update/${id}`, {
      name: procedureGroup.name,
    })
    const { data } = response.data as BaseResponse
    return ProcedureGroup.from(data)
  }

  static async destroyOne(id: number) {
    const response = await AxiosInstance.post(`/procedure-group/destroy/${id}`)
    const { data, meta } = response.data as BaseResponse
    return ProcedureGroup.from(data)
  }
}
