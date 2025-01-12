import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { TicketUser } from '../ticket-user'
import { Ticket } from '../ticket/ticket.model'

export class TicketClinicUserApi {
  static async destroyTicketUser(body: { ticketId: number; ticketUserId: number }) {
    const { ticketId, ticketUserId } = body
    const response = await AxiosInstance.delete(
      `/ticket-clinic/${ticketId}/destroy-ticket-user/${ticketUserId}`
    )
    const { data } = response.data as BaseResponse<{ ticket: any }>
    return {
      ticket: Ticket.from(data.ticket),
    }
  }

  static async updateTicketUserItem(body: {
    ticketId: number
    interactId: number
    interactType: number
    ticketItemId: number
    ticketUserList: TicketUser[]
  }) {
    const { ticketId } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-ticket-user-item`,
      {
        interactType: body.interactType,
        interactId: body.interactId,
        ticketItemId: body.ticketItemId,
        ticketUserList: body.ticketUserList.map((i) => ({
          userId: i.userId || 0,
          roleId: i.roleId || 0,
        })),
      }
    )
    const { data } = response.data as BaseResponse
  }
}
