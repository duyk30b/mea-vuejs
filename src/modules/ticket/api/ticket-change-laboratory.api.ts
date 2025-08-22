import { TicketLaboratoryGroup } from '@/modules/ticket-laboratory-group'
import type { TicketLaboratoryResult } from '@/modules/ticket-laboratory-result'
import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import type { PaymentMoneyStatus } from '../../enum'
import type { TicketLaboratory } from '../../ticket-laboratory'
import type { TicketUser } from '../../ticket-user'

export class TicketChangeLaboratoryApi {
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
    const response = await AxiosInstance.post(`/ticket/${ticketId}/laboratory/upsert-laboratory`, {
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
      `/ticket/${ticketId}/laboratory/destroy-ticket-laboratory/${ticketLaboratoryId}`,
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async destroyTicketLaboratoryGroup(body: {
    ticketId: number
    ticketLaboratoryGroupId: number
  }) {
    const { ticketId, ticketLaboratoryGroupId } = body
    const response = await AxiosInstance.delete(
      `/ticket/${ticketId}/laboratory/destroy-ticket-laboratory-group/${ticketLaboratoryGroupId}`,
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
      `/ticket/${ticketId}/laboratory/update-ticket-laboratory/${ticketLaboratoryId}`,
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

  static async updateResult(options: {
    ticketId: number
    ticketLaboratoryGroupId: number
    startedAt: number
    ticketLaboratoryResultUpdateList: TicketLaboratoryResult[]
    response: {
      ticketLaboratoryGroup: {
        ticket?: boolean
        customer?: boolean
        ticketUserList?: boolean
        imageList?: boolean
        ticketLaboratoryList?: boolean
        ticketLaboratoryResultMap?: boolean
      }
    }
  }) {
    const { ticketId, ticketLaboratoryGroupId } = options
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/laboratory/update-result/${ticketLaboratoryGroupId}`,
      {
        startedAt: options.startedAt,
        ticketLaboratoryResultUpdateList: options.ticketLaboratoryResultUpdateList.map((i) => {
          return {
            id: i.id,
            laboratoryId: i.laboratoryId,
            ticketLaboratoryId: i.ticketLaboratoryId,
            attention: i.attention,
            result: i.result,
          }
        }),
      },
      { params: { response: JSON.stringify(options.response) } },
    )
    const { data } = response.data as BaseResponse<{ ticketLaboratoryGroup: any }>
    return TicketLaboratoryGroup.from(data.ticketLaboratoryGroup)
  }

  static async cancelResult(body: { ticketId: number; ticketLaboratoryGroupId: number }) {
    const { ticketId, ticketLaboratoryGroupId } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/laboratory/cancel-result/${ticketLaboratoryGroupId}`,
    )
    const { data } = response.data as BaseResponse
    return data
  }
}
