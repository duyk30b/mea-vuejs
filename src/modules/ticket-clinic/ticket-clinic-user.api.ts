import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { TicketUser } from '../ticket-user'

export class TicketClinicUserApi {
  static async destroyTicketUser(body: { ticketId: number; ticketUserId: number }) {
    const { ticketId, ticketUserId } = body
    const response = await AxiosInstance.delete(
      `/ticket-clinic/${ticketId}/ticket-user/destroy/${ticketUserId}`,
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
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async chooseUserId(body: {
    ticketId: number
    positionInteractId: number
    positionType: number
    ticketItemId: number
    quantity: number
    ticketUserList: TicketUser[]
  }) {
    const { ticketId } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/ticket-user/choose-user-id`,
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
