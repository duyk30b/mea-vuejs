import { AxiosInstance } from '@/core/axios.instance'
import { debounceAsync } from '@/utils/helpers'
import type { ApiPaginationResponse } from '../pagination'
import {
  ProcedureGetQuery,
  ProcedureListQuery,
  type ProcedurePaginationQuery,
} from './procedure.dto'
import { Procedure } from './procedure.model'

export class ProcedureApi {
  static async pagination(options: ProcedurePaginationQuery) {
    const params = ProcedureGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/procedure/pagination', { params })
    const data = response.data as ApiPaginationResponse
    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      data: Procedure.fromPlains(data.data),
    }
  }

  static async list(options: ProcedureListQuery): Promise<Procedure[]> {
    const params = ProcedureGetQuery.toQuery(options)

    const { data } = await AxiosInstance.get('/procedure/list', { params })
    return Procedure.fromPlains(data)
  }

  static search: (params: ProcedureListQuery) => Promise<Procedure[]> = debounceAsync(
    async (params: ProcedureListQuery): Promise<Procedure[]> => {
      const { data } = await AxiosInstance.get('/procedure/list', { params })
      return Procedure.fromPlains(data)
    },
    200
  )

  static async detail(id: number): Promise<Procedure> {
    const { data } = await AxiosInstance.get(`/procedure/detail/${id}`)
    return Procedure.fromPlain(data)
  }

  static async createOne(procedure: Procedure) {
    const procedureDto = Procedure.toPlain(procedure, 'CREATE')
    const { data } = await AxiosInstance.post('/procedure/create', procedureDto)

    return Procedure.fromPlain(data)
  }

  static async updateOne(id: number, procedure: Procedure) {
    const procedureDto = Procedure.toPlain(procedure, 'UPDATE')
    const { data } = await AxiosInstance.patch(`/procedure/update/${id}`, procedureDto)

    return Procedure.fromPlain(data)
  }

  static async deleteOne(id: number) {
    const { data } = await AxiosInstance.delete(`/procedure/delete/${id}`)
    return data as { success: boolean }
  }
}
