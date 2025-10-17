import { TicketLaboratoryGroup } from '@/modules/ticket-laboratory'
import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import type { PaymentMoneyStatus } from '../../enum'
import type { TicketLaboratory, TicketLaboratoryResult } from '../../ticket-laboratory'
import type { TicketUser } from '../../ticket-user'

export class TicketChangeLaboratoryApi {
  static async addTicketLaboratoryGroup(body: {
    ticketId: string
    ticketLaboratoryGroupAddList: {
      roomId: number
      laboratoryGroupId: number
      createdAt: number | null
      ticketLaboratoryList: TicketLaboratory[]
    }[]
  }) {
    const { ticketId, ticketLaboratoryGroupAddList } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/laboratory/add-ticket-laboratory-group`,
      {
        ticketLaboratoryGroupAddList: ticketLaboratoryGroupAddList.map((tlg) => ({
          laboratoryGroupId: tlg.laboratoryGroupId,
          createdAt: tlg.createdAt,
          roomId: tlg.roomId,
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
            createdAt: tlg.createdAt,
          })),
        })),
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updateTicketLaboratoryGroup(body: {
    ticketId: string
    ticketLaboratoryGroupUpdate: {
      roomId: number
      id: string
      laboratoryGroupId: number
      createdAt: number | null
      ticketLaboratoryList: TicketLaboratory[]
    }
  }) {
    const { ticketId, ticketLaboratoryGroupUpdate } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/laboratory/update-ticket-laboratory-group`,
      {
        ticketLaboratoryGroupUpdate: {
          id: ticketLaboratoryGroupUpdate.id,
          laboratoryGroupId: ticketLaboratoryGroupUpdate.laboratoryGroupId,
          createdAt: ticketLaboratoryGroupUpdate.createdAt,
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
            createdAt: ticketLaboratoryGroupUpdate.createdAt,
          })),
        },
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async destroyTicketLaboratory(body: { ticketId: string; ticketLaboratoryId: string }) {
    const { ticketId, ticketLaboratoryId } = body
    const response = await AxiosInstance.delete(
      `/ticket/${ticketId}/laboratory/destroy-ticket-laboratory/${ticketLaboratoryId}`,
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async destroyTicketLaboratoryGroup(body: {
    ticketId: string
    ticketLaboratoryGroupId: string
  }) {
    const { ticketId, ticketLaboratoryGroupId } = body
    const response = await AxiosInstance.delete(
      `/ticket/${ticketId}/laboratory/destroy-ticket-laboratory-group/${ticketLaboratoryGroupId}`,
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updateRequestTicketLaboratory(body: {
    ticketId: string
    ticketLaboratoryId: string
    ticketLaboratory?: TicketLaboratory
    ticketUserList?: TicketUser[]
  }) {
    const { ticketId, ticketLaboratory, ticketLaboratoryId, ticketUserList } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/laboratory/update-request-ticket-laboratory/${ticketLaboratoryId}`,
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
        ticketUserRequestList: ticketUserList
          ? ticketUserList
            .filter((i) => !!i.userId)
            .map((i) => ({
              positionId: i.positionId,
              userId: i.userId,
            }))
          : undefined,
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updateResult(options: {
    ticketId: string
    ticketLaboratoryGroupId: string
    completedAt: number
    ticketLaboratoryResultUpdateList: TicketLaboratoryResult[]
    response: {
      ticketLaboratoryGroup: {
        ticket?: boolean
        customer?: boolean
        ticketUserRequestList?: boolean
        ticketUserResultList?: boolean
        ticketLaboratoryList?: boolean
        ticketLaboratoryResultMap?: boolean
      }
    }
  }) {
    const { ticketId, ticketLaboratoryGroupId } = options
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/laboratory/update-result/${ticketLaboratoryGroupId}`,
      {
        completedAt: options.completedAt,
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

  static async cancelResult(body: { ticketId: string; ticketLaboratoryGroupId: string }) {
    const { ticketId, ticketLaboratoryGroupId } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/laboratory/cancel-result/${ticketLaboratoryGroupId}`,
    )
    const { data } = response.data as BaseResponse
    return data
  }
}
