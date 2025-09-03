import { TicketProcedureItem } from '@/modules/ticket-procedure/ticket-procedure-item.model'
import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import { TicketProcedure } from '../../ticket-procedure'
import { TicketUser } from '../../ticket-user'

export class TicketChangeProcedureApi {
  static async addTicketProcedureList(obj: {
    ticketId: number
    ticketProcedureWrapList: {
      ticketProcedure: TicketProcedure
      ticketProcedureItemList: TicketProcedureItem[]
      ticketUserRequestList: TicketUser[]
    }[]
  }) {
    const { ticketId, ticketProcedureWrapList } = obj
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/procedure/add-ticket-procedure-list`,
      {
        ticketProcedureWrapList: ticketProcedureWrapList.map((tp) => {
          const { ticketProcedure, ticketProcedureItemList, ticketUserRequestList } = tp
          return {
            ticketUserRequestList: (ticketUserRequestList || [])
              .filter((i) => !!i.userId)
              .map((i) => ({
                positionId: i.positionId || 0,
                userId: i.userId || 0,
              })),
            ticketProcedureItemList: (ticketProcedureItemList || []).map((i, index) => ({
              registeredAt: i.registeredAt,
              indexSession: index,
            })),
            ticketProcedure: {
              priority: ticketProcedure.priority,
              procedureId: ticketProcedure.procedureId,
              type: ticketProcedure.type,

              quantity: ticketProcedure.quantity,
              totalSessions: ticketProcedure.totalSessions,

              expectedPrice: ticketProcedure.expectedPrice,
              discountMoney: ticketProcedure.discountMoney,
              discountPercent: ticketProcedure.discountPercent,
              discountType: ticketProcedure.discountType,
              actualPrice: ticketProcedure.actualPrice,

              status: ticketProcedure.status,
              paymentMoneyStatus: ticketProcedure.paymentMoneyStatus,
              createdAt: ticketProcedure.createdAt,
            },
          }
        }),
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async destroyTicketProcedure(body: { ticketId: number; ticketProcedureId: number }) {
    const { ticketId, ticketProcedureId } = body
    const response = await AxiosInstance.delete(
      `/ticket/${ticketId}/procedure/destroy-ticket-procedure/${ticketProcedureId}`,
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updateTicketProcedure(body: {
    ticketId: number
    ticketProcedureId: number
    ticketProcedure?: TicketProcedure
    ticketProcedureItemList?: TicketProcedureItem[]
    ticketUserRequestList?: TicketUser[]
  }) {
    const {
      ticketId,
      ticketProcedureId,
      ticketProcedure,
      ticketProcedureItemList,
      ticketUserRequestList,
    } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/procedure/update-ticket-procedure/${ticketProcedureId}`,
      {
        ticketProcedure: ticketProcedure
          ? {
            status: ticketProcedure.status,
            quantity: ticketProcedure.quantity,
            totalSessions: ticketProcedure.totalSessions,
            finishedSessions: ticketProcedure.finishedSessions,
            expectedPrice: ticketProcedure.expectedPrice,
            discountType: ticketProcedure.discountType,
            discountMoney: ticketProcedure.discountMoney,
            discountPercent: ticketProcedure.discountPercent,
            actualPrice: ticketProcedure.actualPrice,
          }
          : undefined,
        ticketProcedureItemList: ticketProcedureItemList
          ? ticketProcedureItemList.map((i, index) => ({
            id: i.id || 0,
            registeredAt: i.registeredAt,
            indexSession: index,
          }))
          : undefined,
        ticketUserRequestList: ticketUserRequestList
          ? ticketUserRequestList
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

  static async updatePriorityTicketProcedure(body: {
    ticketId: number
    ticketProcedureList: TicketProcedure[]
  }) {
    const { ticketId, ticketProcedureList } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/procedure/update-priority-ticket-procedure`,
      {
        ticketProcedureList: ticketProcedureList.map((i, index) => ({
          id: i.id,
          priority: index + 1,
        })),
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updateResultTicketProcedureItem(options: {
    ticketId: number
    ticketProcedureItem: {
      ticketProcedureItemId: number
      ticketProcedureId: number
      completedAt: number
      result: string
    }
    imagesChange?: {
      files: File[]
      imageIdsWait: number[]
      externalUrlList: string[]
    }
    ticketUserResultList?: TicketUser[]
  }) {
    const { ticketId, ticketProcedureItem, ticketUserResultList, imagesChange } = options

    const formData = new FormData()

    if (imagesChange) {
      // imagesChange.files.forEach((file) => formData.append('files', file))
      const imagesChangeStr = JSON.stringify({
        imageIdsWait: imagesChange.imageIdsWait,
        externalUrlList: imagesChange.externalUrlList,
      })
      formData.append('imagesChange', imagesChangeStr)
    }

    formData.append('ticketProcedureItem', JSON.stringify(ticketProcedureItem))

    if (ticketUserResultList) {
      formData.append(
        'ticketUserResultList',
        JSON.stringify(
          ticketUserResultList
            .filter((i) => !!i.userId)
            .map((i) => ({
              positionId: i.positionId || 0,
              userId: i.userId || 0,
            })),
        ),
      )
    }

    const response = await AxiosInstance.post(
      `ticket/${ticketId}/procedure/update-result-ticket-procedure-item`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    )
    const { data } = response.data as BaseResponse<{ ticketProcedureModified: any }>

    return TicketProcedure.from(data.ticketProcedureModified)
  }

  static async cancelTicketProcedureItem(options: {
    ticketId: number
    ticketProcedureId: number
    ticketProcedureItemId: number
    cancelReason: string
  }) {
    const { ticketId } = options
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/procedure/cancel-ticket-procedure-item`,
      {
        ticketProcedureId: options.ticketProcedureId,
        ticketProcedureItemId: options.ticketProcedureItemId,
        cancelReason: options.cancelReason,
      },
    )
    const { data } = response.data as BaseResponse<{ ticketProcedureModified: any }>
    return TicketProcedure.from(data.ticketProcedureModified)
  }
}
