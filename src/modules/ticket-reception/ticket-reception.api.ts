import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import {
    TicketReceptionDetailQuery,
    TicketReceptionGetQuery,
    type TicketReceptionPaginationQuery,
} from './ticket-reception.dto'
import { TicketReception } from './ticket-reception.model'

export class TicketReceptionApi {
  static async pagination(options: TicketReceptionPaginationQuery) {
    const params = TicketReceptionGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/ticket-reception/pagination', { params })
    const { data, meta } = response.data as FullResponse
    return {
      page: data.page,
      total: data.total,
      limit: data.limit,
      ticketReceptionList: TicketReception.fromList(data.ticketReceptionList),
    }
  }

  static async detail(id: string, options: TicketReceptionDetailQuery) {
    const params = TicketReceptionGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/ticket-reception/detail/${id}`, { params })
    const { data } = response.data as FullResponse<{ ticketReception: any }>
    return TicketReception.from(data.ticketReception)
  }
}
