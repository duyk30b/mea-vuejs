import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { TicketLaboratory } from '../ticket-laboratory'
import type { TicketUser } from '../ticket-user'

export class TicketClinicLaboratoryApi {
  static async addTicketLaboratoryList(body: {
    ticketId: number
    ticketLaboratoryList: TicketLaboratory[]
  }) {
    const { ticketId, ticketLaboratoryList } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/add-ticket-laboratory-list`,
      {
        ticketLaboratoryList: ticketLaboratoryList.map((i) => ({
          priority: i.priority,
          laboratoryId: i.laboratoryId,
          expectedPrice: i.expectedPrice,
          discountMoney: i.discountMoney,
          discountPercent: i.discountPercent,
          discountType: i.discountType,
          actualPrice: i.actualPrice,
        })),
      }
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async destroyTicketLaboratory(body: { ticketId: number; ticketLaboratoryId: number }) {
    const { ticketId, ticketLaboratoryId } = body
    const response = await AxiosInstance.delete(
      `/ticket-clinic/${ticketId}/destroy-ticket-laboratory/${ticketLaboratoryId}`
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
              // attention: ticketLaboratory.attention,
              // result: ticketLaboratory.result,
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
      }
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updateResult(body: {
    ticketId: number
    startedAt: number
    ticketLaboratoryUpdateList: TicketLaboratory[]
  }) {
    const { ticketId } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-result-ticket-laboratory`,
      {
        startedAt: body.startedAt,
        ticketLaboratoryUpdateList: body.ticketLaboratoryUpdateList.map((i) => {
          return {
            id: i.id,
            attention: JSON.stringify(i.attentionParse),
            result: JSON.stringify(i.resultParse),
          }
        }),
      }
    )
    const { data } = response.data as BaseResponse<{ ticketId: number }>
    return data
  }
}
