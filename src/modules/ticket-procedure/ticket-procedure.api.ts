import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
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
    const { data, meta } = response.data as FullResponse
    return {
      page: data.page,
      limit: data.limit,
      total: data.total,
      ticketProcedureList: TicketProcedure.fromList(data.ticketProcedureList),
    }
  }

  static async detail(ticketProcedureId: string, options: TicketProcedureDetailQuery) {
    const params = TicketProcedureGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/ticket-procedure/detail/${ticketProcedureId}`, {
      params,
    })
    const { data } = response.data as FullResponse<{ ticketProcedure: any }>
    return TicketProcedure.from(data.ticketProcedure)
  }
}
