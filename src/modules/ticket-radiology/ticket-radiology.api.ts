import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import {
    TicketRadiologyDetailQuery,
    TicketRadiologyGetQuery,
    type TicketRadiologyPaginationQuery,
} from './ticket-radiology.dto'
import { TicketRadiology } from './ticket-radiology.model'

export class TicketRadiologyApi {
  static async pagination(options: TicketRadiologyPaginationQuery) {
    const params = TicketRadiologyGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/ticket-radiology/pagination', { params })
    const { data, meta } = response.data as FullResponse
    return {
      page: data.page,
      limit: data.limit,
      total: data.total,
      ticketRadiologyList: TicketRadiology.fromList(data.ticketRadiologyList),
    }
  }

  static async detail(ticketRadiologyId: string, options: TicketRadiologyDetailQuery) {
    const params = TicketRadiologyGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/ticket-radiology/detail/${ticketRadiologyId}`, { params })
    const { data } = response.data as FullResponse<{ ticketRadiology: any }>
    return TicketRadiology.from(data.ticketRadiology)
  }
}
