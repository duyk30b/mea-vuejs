import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  TicketRegimenDetailQuery,
  TicketRegimenGetQuery,
  type TicketRegimenPaginationQuery,
} from './ticket-regimen.dto'
import { TicketRegimen } from './ticket-regimen.model'

export class TicketRegimenApi {
  static async pagination(options: TicketRegimenPaginationQuery) {
    const params = TicketRegimenGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/ticket-regimen/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      page: data.page,
      limit: data.limit,
      total: data.total,
      ticketRegimenList: TicketRegimen.fromList(data.ticketRegimenList),
    }
  }

  static async detail(ticketRegimenId: string, options: TicketRegimenDetailQuery) {
    const params = TicketRegimenGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/ticket-regimen/detail/${ticketRegimenId}`, {
      params,
    })
    const { data } = response.data as BaseResponse<{ ticketRegimen: any }>
    return TicketRegimen.from(data.ticketRegimen)
  }
}
