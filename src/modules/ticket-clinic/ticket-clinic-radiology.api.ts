import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { TicketRadiology } from '../ticket-radiology'
import type { TicketUser } from '../ticket-user'

export class TicketClinicRadiologyApi {
  static async addTicketRadiology(body: { ticketId: number; ticketRadiology: TicketRadiology }) {
    const { ticketId, ticketRadiology } = body
    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/add-ticket-radiology`, {
      priority: ticketRadiology.priority,
      roomId: ticketRadiology.roomId,
      customerId: ticketRadiology.customerId,
      radiologyId: ticketRadiology.radiologyId,

      paymentMoneyStatus: ticketRadiology.paymentMoneyStatus,

      registeredAt: ticketRadiology.registeredAt,
      costPrice: ticketRadiology.costPrice,
      expectedPrice: ticketRadiology.expectedPrice,
      discountMoney: ticketRadiology.discountMoney,
      discountPercent: ticketRadiology.discountPercent,
      discountType: ticketRadiology.discountType,
      actualPrice: ticketRadiology.actualPrice,

      printHtmlId: ticketRadiology.printHtmlId,
      result: ticketRadiology.result,
      description: ticketRadiology.description,
      customStyles: ticketRadiology.customStyles,
      customVariables: ticketRadiology.customVariables,
    })
    const { data } = response.data as BaseResponse<boolean>
  }

  static async destroyTicketRadiology(body: { ticketId: number; ticketRadiologyId: number }) {
    const { ticketId, ticketRadiologyId } = body
    const response = await AxiosInstance.delete(
      `/ticket-clinic/${ticketId}/destroy-ticket-radiology/${ticketRadiologyId}`,
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updateMoneyTicketRadiology(body: {
    ticketId: number
    ticketRadiologyId: number
    ticketRadiology?: TicketRadiology
    ticketUserList?: TicketUser[]
  }) {
    const { ticketId, ticketRadiology, ticketRadiologyId, ticketUserList } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-money-ticket-radiology/${ticketRadiologyId}`,
      {
        ticketRadiology: ticketRadiology
          ? {
            expectedPrice: ticketRadiology.expectedPrice,
            discountType: ticketRadiology.discountType,
            discountMoney: ticketRadiology.discountMoney,
            discountPercent: ticketRadiology.discountPercent,
            actualPrice: ticketRadiology.actualPrice,
          }
          : undefined,
        ticketUserList: ticketUserList
          ? ticketUserList.map((i) => ({
            id: i.id || 0,
            roleId: i.roleId || 0,
            userId: i.userId || 0,
          }))
          : undefined,
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updatePriorityTicketRadiology(body: {
    ticketId: number
    ticketRadiologyList: TicketRadiology[]
  }) {
    const { ticketId, ticketRadiologyList } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-priority-ticket-radiology`,
      {
        ticketRadiologyList: ticketRadiologyList.map((i, index) => ({
          id: i.id,
          priority: index + 1,
        })),
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }
}
