import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { TicketUser } from '../ticket-user'

export class TicketClinicUserApi {
  static async destroyTicketUser(body: { ticketId: number; ticketUserId: number }) {
    const { ticketId, ticketUserId } = body
    const response = await AxiosInstance.delete(
      `/ticket-clinic/${ticketId}/ticket-uer/destroy/${ticketUserId}`
    )
    const { data } = response.data as BaseResponse<boolean>
    return data
  }

  static async updateTicketUser(body: {
    ticketId: number
    ticketUserId: number
    ticketUser: TicketUser
  }) {
    const { ticketId, ticketUser, ticketUserId } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/ticket-user/update/${ticketUserId}`,
      {
        commissionCalculatorType: ticketUser.commissionCalculatorType,
        commissionMoney: ticketUser.commissionMoney,
        commissionPercentActual: ticketUser.commissionPercentActual,
        commissionPercentExpected: ticketUser.commissionPercentExpected,
      }
    )
    const { data } = response.data as BaseResponse<boolean>
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
      `/ticket-clinic/${ticketId}/ticket-user/choose-user-id-for-ticket`,
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
