import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  TicketDetailQuery,
  TicketGetQuery,
  TicketListQuery,
  type TicketPaginationQuery,
} from './ticket.dto'
import { Ticket } from './ticket.model'

export class TicketApi {
  static async pagination(options: TicketPaginationQuery) {
    const params = TicketGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/ticket/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: Ticket.fromList(data),
    }
  }

  static async list(options: TicketListQuery) {
    const params = TicketGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/ticket/list', { params })
    const { data } = response.data as BaseResponse<any[]>
    return Ticket.fromList(data)
  }

  static async detail(id: number, options: TicketDetailQuery): Promise<Ticket> {
    const params = TicketGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/ticket/detail/${id}`, { params })
    const { data } = response.data as BaseResponse<{ ticket: any }>
    return Ticket.from(data.ticket)
  }
}
