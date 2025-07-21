import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { TicketProcedure } from '../ticket-procedure'
import type { TicketUser } from '../ticket-user'

export class TicketClinicProcedureApi {
  static async addTicketProcedure(body: {
    ticketId: number
    ticketProcedure: TicketProcedure
    ticketUserList: TicketUser[]
  }) {
    const { ticketId, ticketProcedure, ticketUserList } = body
    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/add-ticket-procedure`, {
      ticketProcedure: {
        priority: ticketProcedure.priority,
        procedureId: ticketProcedure.procedureId,

        paymentMoneyStatus: ticketProcedure.paymentMoneyStatus,

        quantity: ticketProcedure.quantity,
        expectedPrice: ticketProcedure.expectedPrice,
        discountMoney: ticketProcedure.discountMoney,
        discountPercent: ticketProcedure.discountPercent,
        discountType: ticketProcedure.discountType,
        actualPrice: ticketProcedure.actualPrice,
      },
      ticketUserList: ticketUserList.map((i) => ({
        id: i.id || 0,
        roleId: i.roleId || 0,
        userId: i.userId || 0,
      })),
    })
    const { data } = response.data as BaseResponse<boolean>
  }

  static async destroyTicketProcedure(body: { ticketId: number; ticketProcedureId: number }) {
    const { ticketId, ticketProcedureId } = body
    const response = await AxiosInstance.delete(
      `/ticket-clinic/${ticketId}/destroy-ticket-procedure/${ticketProcedureId}`,
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updateTicketProcedure(body: {
    ticketId: number
    ticketProcedureId: number
    ticketProcedure?: TicketProcedure
    ticketUserList?: TicketUser[]
  }) {
    const { ticketId, ticketProcedure, ticketProcedureId, ticketUserList } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-ticket-procedure/${ticketProcedureId}`,
      {
        ticketProcedure: ticketProcedure
          ? {
            quantity: ticketProcedure.quantity,
            expectedPrice: ticketProcedure.expectedPrice,
            discountType: ticketProcedure.discountType,
            discountMoney: ticketProcedure.discountMoney,
            discountPercent: ticketProcedure.discountPercent,
            actualPrice: ticketProcedure.actualPrice,
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

  static async updatePriorityTicketProcedure(body: {
    ticketId: number
    ticketProcedureList: TicketProcedure[]
  }) {
    const { ticketId, ticketProcedureList } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-priority-ticket-procedure`,
      {
        ticketProcedureList: ticketProcedureList.map((i, index) => ({
          id: i.id,
          priority: index + 1,
        })),
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }
}
