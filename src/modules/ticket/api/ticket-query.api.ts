import { AxiosInstance } from '../../../core/axios.instance'
import type { FullResponse } from '../../_base/base-dto'
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
    const { data, time } = response.data as FullResponse<{
      ticketList: any[]
      total: number
      page: number
      limit: number
    }>
    return {
      time,
      total: data.total,
      page: data.page,
      limit: data.limit,
      ticketList: Ticket.fromList(data.ticketList),
    }
  }

  static async list(options: TicketListQuery) {
    const params = TicketGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/ticket/list', { params })
    const { data } = response.data as FullResponse<{ ticketList: any[] }>
    return { ticketList: Ticket.fromList(data.ticketList) }
  }

  static async detail(ticketId: string, options: TicketDetailQuery) {
    const params = TicketGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/ticket/detail/${ticketId}`, { params })
    const { data } = response.data as FullResponse<{ ticket: any }>
    return { ticket: Ticket.from(data.ticket) }
  }
}
