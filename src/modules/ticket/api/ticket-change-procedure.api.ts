import type { TicketProcedureItem } from '@/modules/ticket-procedure/ticket-procedure-item.model'
import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import { TicketProcedure } from '../../ticket-procedure'
import type { TicketUser } from '../../ticket-user'

export class TicketChangeProcedureApi {
  static async addTicketProcedureList(body: {
    ticketId: number
    ticketProcedureList: TicketProcedure[]
  }) {
    const { ticketId, ticketProcedureList } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/procedure/add-ticket-procedure-list`,
      {
        ticketProcedureList: ticketProcedureList.map((tp) => {
          return {
            ticketUserList: tp.ticketUserList.map((i) => ({
              id: i.id || 0,
              roleId: i.roleId || 0,
              userId: i.userId || 0,
            })),
            ticketProcedureItemList: (tp.ticketProcedureItemList || []).map((i) => ({
              completedAt: i.completedAt,
            })),
            ticketProcedure: {
              priority: tp.priority,
              procedureId: tp.procedureId,

              quantity: tp.quantity,
              totalSessions: tp.totalSessions,

              expectedPrice: tp.expectedPrice,
              discountMoney: tp.discountMoney,
              discountPercent: tp.discountPercent,
              discountType: tp.discountType,
              actualPrice: tp.actualPrice,

              status: tp.status,
              paymentMoneyStatus: tp.paymentMoneyStatus,
              createdAt: tp.createdAt,
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
    ticketUserList?: TicketUser[]
  }) {
    const {
      ticketId,
      ticketProcedureId,
      ticketProcedure,
      ticketProcedureItemList,
      ticketUserList,
    } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/procedure/update-ticket-procedure/${ticketProcedureId}`,
      {
        ticketProcedure: ticketProcedure
          ? {
            quantity: ticketProcedure.quantity,
            totalSessions: ticketProcedure.totalSessions,
            expectedPrice: ticketProcedure.expectedPrice,
            discountType: ticketProcedure.discountType,
            discountMoney: ticketProcedure.discountMoney,
            discountPercent: ticketProcedure.discountPercent,
            actualPrice: ticketProcedure.actualPrice,
          }
          : undefined,
        ticketProcedureItemList: ticketProcedureItemList
          ? ticketProcedureItemList.map((i) => ({
            id: i.id || 0,
            completedAt: i.completedAt,
          }))
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
    ticketUserList?: TicketUser[]
  }) {
    const { ticketId, ticketProcedureItem, ticketUserList, imagesChange } = options

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

    if (options.ticketUserList) {
      formData.append(
        'ticketUserList',
        JSON.stringify(
          options.ticketUserList.map((i) => ({
            id: i.id || 0,
            roleId: i.roleId || 0,
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
    const { data } = response.data as BaseResponse<{ ticketProcedure: any }>

    return TicketProcedure.from(data.ticketProcedure)
  }
}
