import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  VisitDetailQuery,
  VisitGetQuery,
  VisitListQuery,
  type VisitPaginationQuery,
} from './visit.dto'
import { Visit } from './visit.model'

export class VisitApi {
  static async pagination(options: VisitPaginationQuery) {
    const params = VisitGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/visit/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: Visit.fromList(data),
    }
  }

  static async list(options: VisitListQuery) {
    const params = VisitGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/visit/list', { params })
    const { data } = response.data as BaseResponse
    return Visit.fromList(data)
  }

  static async detail(id: number, options: VisitDetailQuery): Promise<Visit> {
    const params = VisitGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/visit/detail/${id}`, { params })
    const { data } = response.data as BaseResponse
    return Visit.from(data)
  }
}
