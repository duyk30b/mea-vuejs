import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  TicketProcedureDetailQuery,
  TicketProcedureGetQuery,
  type TicketProcedurePaginationQuery,
} from './ticket-procedure.dto'
import { TicketProcedure } from './ticket-procedure.model'

export class TicketProcedureApi {
  static async pagination(options: TicketProcedurePaginationQuery) {
    const params = TicketProcedureGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/ticket-procedure/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: TicketProcedure.fromList(data),
    }
  }

  static async detail(id: number, options: TicketProcedureDetailQuery) {
    const params = TicketProcedureGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/ticket-radiology/detail/${id}`, { params })
    const { data } = response.data as BaseResponse<{ ticketProcedure: any }>
    return TicketProcedure.from(data.ticketProcedure)
  }
}
