import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { PaymentMoneyStatus } from '../enum'
import type { TicketLaboratory } from '../ticket-laboratory'
import type { TicketUser } from '../ticket-user'

export class TicketClinicLaboratoryApi {
  static async upsertLaboratory(body: {
    ticketId: number
    ticketLaboratoryGroupAddList?: {
      roomId: number
      laboratoryGroupId: number
      registeredAt: number | null
      paymentMoneyStatus: PaymentMoneyStatus
      ticketLaboratoryList: TicketLaboratory[]
    }[]
    ticketLaboratoryGroupUpdate?: {
      roomId: number
      id: number
      laboratoryGroupId: number
      registeredAt: number | null
      ticketLaboratoryList: TicketLaboratory[]
    }
  }) {
    const { ticketId, ticketLaboratoryGroupAddList, ticketLaboratoryGroupUpdate } = body
    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/upsert-laboratory`, {
      ticketLaboratoryGroupAddList: ticketLaboratoryGroupAddList
        ? ticketLaboratoryGroupAddList.map((tlg) => ({
          laboratoryGroupId: tlg.laboratoryGroupId,
          registeredAt: tlg.registeredAt,
          roomId: tlg.roomId,
          paymentMoneyStatus: tlg.paymentMoneyStatus,
          ticketLaboratoryList: tlg.ticketLaboratoryList.map((tl) => ({
            priority: tl.priority,
            laboratoryId: tl.laboratoryId,
            laboratoryGroupId: tl.laboratoryGroupId,
            costPrice: tl.costPrice,
            expectedPrice: tl.expectedPrice,
            discountMoney: tl.discountMoney,
            discountPercent: tl.discountPercent,
            discountType: tl.discountType,
            actualPrice: tl.actualPrice,
            paymentMoneyStatus: tl.paymentMoneyStatus,
          })),
        }))
        : undefined,
      ticketLaboratoryGroupUpdate: ticketLaboratoryGroupUpdate
        ? {
          id: ticketLaboratoryGroupUpdate.id,
          laboratoryGroupId: ticketLaboratoryGroupUpdate.laboratoryGroupId,
          registeredAt: ticketLaboratoryGroupUpdate.registeredAt,
          roomId: ticketLaboratoryGroupUpdate.roomId,
          ticketLaboratoryList: ticketLaboratoryGroupUpdate.ticketLaboratoryList.map((tl) => ({
            priority: tl.priority,
            laboratoryId: tl.laboratoryId,
            laboratoryGroupId: tl.laboratoryGroupId,
            costPrice: tl.costPrice,
            expectedPrice: tl.expectedPrice,
            discountMoney: tl.discountMoney,
            discountPercent: tl.discountPercent,
            discountType: tl.discountType,
            actualPrice: tl.actualPrice,
          })),
        }
        : undefined,
    })
    const { data } = response.data as BaseResponse<boolean>
  }

  static async destroyTicketLaboratory(body: { ticketId: number; ticketLaboratoryId: number }) {
    const { ticketId, ticketLaboratoryId } = body
    const response = await AxiosInstance.delete(
      `/ticket-clinic/${ticketId}/destroy-ticket-laboratory/${ticketLaboratoryId}`,
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async destroyTicketLaboratoryGroup(body: {
    ticketId: number
    ticketLaboratoryGroupId: number
  }) {
    const { ticketId, ticketLaboratoryGroupId } = body
    const response = await AxiosInstance.delete(
      `/ticket-clinic/${ticketId}/destroy-ticket-laboratory-group/${ticketLaboratoryGroupId}`,
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updateTicketLaboratory(body: {
    ticketId: number
    ticketLaboratoryId: number
    ticketLaboratory?: TicketLaboratory
    ticketUserList?: TicketUser[]
  }) {
    const { ticketId, ticketLaboratory, ticketLaboratoryId, ticketUserList } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-ticket-laboratory/${ticketLaboratoryId}`,
      {
        ticketLaboratory: ticketLaboratory
          ? {
            expectedPrice: ticketLaboratory.expectedPrice,
            discountType: ticketLaboratory.discountType,
            discountMoney: ticketLaboratory.discountMoney,
            discountPercent: ticketLaboratory.discountPercent,
            actualPrice: ticketLaboratory.actualPrice,
          }
          : undefined,
        ticketUserList: ticketUserList
          ? ticketUserList.map((i) => ({
            roleId: i.roleId || 0,
            userId: i.userId || 0,
          }))
          : undefined,
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }
}
