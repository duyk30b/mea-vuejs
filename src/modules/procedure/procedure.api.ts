import { AxiosInstance } from '../../core/axios.instance'
import { debounceAsync } from '../../utils/helpers'
import type { BaseResponse } from '../_base/base-dto'
import { USER_CREATE, USER_UPDATE } from '../_base/base-expose'
import type { ApiPaginationResponse } from '../pagination'
import {
  ProcedureDetailQuery,
  ProcedureGetQuery,
  ProcedureListQuery,
  type ProcedurePaginationQuery,
} from './procedure.dto'
import { Procedure } from './procedure.model'

export class ProcedureApi {
  static async pagination(options: ProcedurePaginationQuery) {
    const params = ProcedureGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/procedure/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: Procedure.fromPlains(data),
    }
  }

  static async list(options: ProcedureListQuery) {
    const params = ProcedureGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/procedure/list', { params })
    const { data, time } = response.data as BaseResponse
    return {
      time: new Date(time),
      data: Procedure.fromPlains(data),
    }
  }

  static search: (params: ProcedureListQuery) => Promise<Procedure[]> = debounceAsync(
    async (params: ProcedureListQuery): Promise<Procedure[]> => {
      const response = await AxiosInstance.get('/procedure/list', { params })
      const { data } = response.data as BaseResponse
      return Procedure.fromPlains(data)
    },
    200
  )

  static async detail(id: number, options: ProcedureDetailQuery): Promise<Procedure> {
    const params = ProcedureGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/procedure/detail/${id}`, { params })
    const { data } = response.data as BaseResponse
    return Procedure.fromPlain(data)
  }

  static async createOne(instance: Procedure) {
    const plain = Procedure.toPlain(instance, USER_CREATE)
    const response = await AxiosInstance.post('/procedure/create', plain)
    const { data } = response.data as BaseResponse
    return Procedure.fromPlain(data)
  }

  static async updateOne(id: number, instance: Procedure) {
    const plain = Procedure.toPlain(instance, USER_UPDATE)
    const response = await AxiosInstance.patch(`/procedure/update/${id}`, plain)
    const { data } = response.data as BaseResponse
    return Procedure.fromPlain(data)
  }

  static async deleteOne(id: number) {
    const response = await AxiosInstance.delete(`/procedure/delete/${id}`)
    const { data } = response.data as BaseResponse
    return Procedure.fromPlain(data)
  }
}
