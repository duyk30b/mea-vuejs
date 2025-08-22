import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import type { TicketUser } from '../../ticket-user'

export class TicketChangeUserApi {
  static async destroyTicketUser(body: { ticketId: number; ticketUserId: number }) {
    const { ticketId, ticketUserId } = body
    const response = await AxiosInstance.delete(
      `/ticket/${ticketId}/user/destroy-ticket-user/${ticketUserId}`,
    )
    const { data } = response.data as BaseResponse<boolean>
    return data
  }

  static async updateTicketUserCommission(body: {
    ticketId: number
    ticketUserId: number
    ticketUser: TicketUser
  }) {
    const { ticketId, ticketUser, ticketUserId } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/user/update-ticket-user-commission/${ticketUserId}`,
      {
        commissionCalculatorType: ticketUser.commissionCalculatorType,
        commissionMoney: ticketUser.commissionMoney,
        commissionPercentActual: ticketUser.commissionPercentActual,
        commissionPercentExpected: ticketUser.commissionPercentExpected,
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updateTicketUserPosition(body: {
    ticketId: number
    positionInteractId: number
    positionType: number
    ticketItemId: number
    quantity: number
    ticketUserList: TicketUser[]
  }) {
    const { ticketId } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/user/update-ticket-user-position`,
      {
        positionType: body.positionType,
        positionInteractId: body.positionInteractId,
        ticketItemId: body.ticketItemId,
        quantity: body.quantity,
        ticketUserList: body.ticketUserList.map((i) => ({
          id: i.id || 0,
          userId: i.userId || 0,
          roleId: i.roleId || 0,
        })),
      },
    )
    const { data } = response.data as BaseResponse
  }
}
