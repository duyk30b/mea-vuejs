import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import {
  TicketDetailQuery,
  TicketGetQuery,
  TicketListQuery,
  type TicketPaginationQuery,
} from '../ticket.dto'
import { Ticket } from '../ticket.model'

export class TicketQueryApi {
  static async pagination(options: TicketPaginationQuery) {
    const params = TicketGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/ticket/pagination', { params })
    const { data } = response.data as BaseResponse<{
      ticketList: any[]
      total: number
      page: number
      limit: number
    }>
    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      ticketList: Ticket.fromList(data.ticketList),
    }
  }

  static async list(options: TicketListQuery) {
    const params = TicketGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/ticket/list', { params })
    const { data } = response.data as BaseResponse<{ ticketList: any[] }>
    return { ticketList: Ticket.fromList(data.ticketList) }
  }

  static async detail(id: number, options: TicketDetailQuery) {
    const params = TicketGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/ticket/detail/${id}`, { params })
    const { data } = response.data as BaseResponse<{ ticket: any }>
    return { ticket: Ticket.from(data.ticket) }
  }
}
