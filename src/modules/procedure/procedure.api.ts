import { AxiosInstance } from '../../core/axios.instance'
import { debounceAsync } from '../../utils/helpers'
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

  static async detail(id: number, options: ProcedureDetailQuery): Promise<Procedure> {
    const params = ProcedureGetQuery.toQuery(options)

    const { data } = await AxiosInstance.get(`/procedure/detail/${id}`, { params })
    return Procedure.fromPlain(data)
  }

  static async createOne(instance: Procedure) {
    const plain = Procedure.toPlain(instance, 'CREATE')
    const { data } = await AxiosInstance.post('/procedure/create', plain)

    return Procedure.fromPlain(data)
  }

  static async updateOne(id: number, instance: Procedure) {
    const plain = Procedure.toPlain(instance, 'UPDATE')
    const { data } = await AxiosInstance.patch(`/procedure/update/${id}`, plain)

    return Procedure.fromPlain(data)
  }

  static async deleteOne(id: number) {
    const { data } = await AxiosInstance.delete(`/procedure/delete/${id}`)

    return Procedure.fromPlain(data)
  }
}
