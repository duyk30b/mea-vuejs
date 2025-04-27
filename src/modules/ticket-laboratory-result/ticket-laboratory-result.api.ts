import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  TicketLaboratoryResultDetailQuery,
  TicketLaboratoryResultGetQuery,
  type TicketLaboratoryResultPaginationQuery,
} from './ticket-laboratory-result.dto'
import { TicketLaboratoryResult } from './ticket-laboratory-result.model'

export class TicketLaboratoryResultApi {
  static async pagination(options: TicketLaboratoryResultPaginationQuery) {
    const params = TicketLaboratoryResultGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/ticket-laboratory/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: TicketLaboratoryResult.fromList(data),
    }
  }

  static async detail(id: number, options: TicketLaboratoryResultDetailQuery) {
    const params = TicketLaboratoryResultGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/ticket-laboratory/detail/${id}`, { params })
    const { data } = response.data as BaseResponse<{ ticketLaboratory: any }>
    return TicketLaboratoryResult.from(data.ticketLaboratory)
  }
}
