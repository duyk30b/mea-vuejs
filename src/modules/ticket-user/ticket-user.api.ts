import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import { TicketUserDetailQuery, TicketUserGetQuery, TicketUserListQuery, type TicketUserPaginationQuery } from './ticket-user.dto'
import { TicketUser } from './ticket-user.model'


export class TicketUserApi {
  static async pagination(options: TicketUserPaginationQuery) {
    const params = TicketUserGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/ticket-user/pagination', { params })
    const { data, meta } = response.data as FullResponse
    return {
      page: data.page,
      total: data.total,
      limit: data.limit,
      ticketUserList: TicketUser.fromList(data.ticketUserList),
    }
  }

  static async sumCommissionMoney(options: TicketUserListQuery) {
    const params = TicketUserGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/ticket-user/sum-commission-money`, { params })
    const { data } = response.data as FullResponse<{ sumCommissionMoney: number }>
    return data
  }
}
