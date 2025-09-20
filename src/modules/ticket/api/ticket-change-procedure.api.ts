import { TicketRegimen } from '@/modules/ticket-regimen'
import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import { TicketProcedure } from '../../ticket-procedure'
import { TicketUser } from '../../ticket-user'

export class TicketChangeProcedureApi {
  static async addTicketProcedureList(obj: {
    ticketId: number
    ticketRegimenAddWrapList: {
      ticketRegimenAdd: TicketRegimen
      ticketUserRequestAddList: TicketUser[]
      ticketProcedureRegimenAddWrapList: {
        totalSession: number
        ticketProcedureAdd: TicketProcedure
      }[]
    }[]
    ticketProcedureNormalWrapList: {
      ticketProcedureAdd: TicketProcedure
      ticketUserRequestAddList: TicketUser[]
    }[]
  }) {
    const { ticketId, ticketRegimenAddWrapList, ticketProcedureNormalWrapList } = obj
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/procedure/add-ticket-procedure-list`,
      {
        ticketRegimenAddWrapList: ticketRegimenAddWrapList.map((trWrap) => {
          const { ticketRegimenAdd, ticketProcedureRegimenAddWrapList, ticketUserRequestAddList } =
            trWrap
          return {
            ticketRegimenAdd: {
              regimenId: ticketRegimenAdd.regimenId,
              paymentMoneyStatus: ticketRegimenAdd.paymentMoneyStatus,

              expectedPrice: ticketRegimenAdd.expectedPrice,
              discountMoney: ticketRegimenAdd.discountMoney,
              discountPercent: ticketRegimenAdd.discountPercent,
              discountType: ticketRegimenAdd.discountType,
              actualPrice: ticketRegimenAdd.actualPrice,
            },
            ticketProcedureRegimenAddWrapList: (ticketProcedureRegimenAddWrapList || [])
              .filter((tpWrap) => tpWrap.totalSession > 0)
              .map((tpWrap, index) => {
                const { ticketProcedureAdd } = tpWrap
                return {
                  ticketProcedureAdd: {
                    priority: ticketProcedureAdd.priority,
                    procedureId: ticketProcedureAdd.procedureId,
                    status: ticketProcedureAdd.status,
                    paymentMoneyStatus: ticketProcedureAdd.paymentMoneyStatus,

                    quantity: ticketProcedureAdd.quantity,

                    expectedPrice: ticketProcedureAdd.expectedPrice,
                    discountMoney: ticketProcedureAdd.discountMoney,
                    discountPercent: ticketProcedureAdd.discountPercent,
                    discountType: ticketProcedureAdd.discountType,
                    actualPrice: ticketProcedureAdd.actualPrice,
                  },
                  totalSession: tpWrap.totalSession,
                }
              }),
            ticketUserRequestAddList: (ticketUserRequestAddList || [])
              .filter((i) => !!i.userId)
              .map((i) => ({
                positionId: i.positionId || 0,
                userId: i.userId || 0,
              })),
          }
        }),
        ticketProcedureNormalWrapList: ticketProcedureNormalWrapList.map((tp) => {
          const { ticketProcedureAdd, ticketUserRequestAddList } = tp
          return {
            ticketProcedureAdd: {
              priority: ticketProcedureAdd.priority,
              procedureId: ticketProcedureAdd.procedureId,
              status: ticketProcedureAdd.status,
              paymentMoneyStatus: ticketProcedureAdd.paymentMoneyStatus,

              quantity: ticketProcedureAdd.quantity,

              expectedPrice: ticketProcedureAdd.expectedPrice,
              discountMoney: ticketProcedureAdd.discountMoney,
              discountPercent: ticketProcedureAdd.discountPercent,
              discountType: ticketProcedureAdd.discountType,
              actualPrice: ticketProcedureAdd.actualPrice,
            },
            ticketUserRequestAddList: (ticketUserRequestAddList || [])
              .filter((i) => !!i.userId)
              .map((i) => ({
                positionId: i.positionId || 0,
                userId: i.userId || 0,
              })),
          }
        }),
      },
    )
    const { data } = response.data as BaseResponse<{
      ticketModified: any
      ticketRegimenCreatedList: any[]
      ticketProcedureNormalCreatedList: any[]
    }>
  }

  static async destroyTicketProcedure(body: { ticketId: number; ticketProcedureId: number }) {
    const { ticketId, ticketProcedureId } = body
    const response = await AxiosInstance.delete(
      `/ticket/${ticketId}/procedure/destroy-ticket-procedure/${ticketProcedureId}`,
    )
    const { data } = response.data as BaseResponse<{ ticketId: any; ticketProcedureId: number }>
  }

  static async destroyTicketRegimen(body: { ticketId: number; ticketRegimenId: number }) {
    const { ticketId, ticketRegimenId } = body
    const response = await AxiosInstance.delete(
      `/ticket/${ticketId}/procedure/destroy-ticket-regimen/${ticketRegimenId}`,
    )
    const { data } = response.data as BaseResponse<{ ticketId: any; ticketRegimenId: number }>
  }

  static async updateMoneyTicketProcedure(body: {
    ticketId: number
    ticketProcedureId: number
    ticketProcedure: TicketProcedure
  }) {
    const { ticketId, ticketProcedureId, ticketProcedure } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/procedure/update-money-ticket-procedure/${ticketProcedureId}`,
      {
        expectedPrice: ticketProcedure.expectedPrice,
        discountMoney: ticketProcedure.discountMoney,
        discountPercent: ticketProcedure.discountPercent,
        discountType: ticketProcedure.discountType,
        actualPrice: ticketProcedure.actualPrice,
      },
    )
    const { data } = response.data as BaseResponse<{ ticketProcedureModified: any }>
    return TicketProcedure.from(data.ticketProcedureModified)
  }

  static async updateUserRequestTicketProcedure(body: {
    ticketId: number
    ticketProcedureId: number
    ticketUserRequestList: TicketUser[]
  }) {
    const { ticketId, ticketProcedureId } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/procedure/update-user-request-ticket-procedure/${ticketProcedureId}`,
      {
        ticketUserRequestList: body.ticketUserRequestList
          .filter((i) => !!i.userId)
          .map((i) => ({
            positionId: i.positionId,
            userId: i.userId,
          })),
      },
    )
    const { data } = response.data as BaseResponse<{ ticketProcedureModified: any }>
  }

  static async updateUserResultTicketProcedure(body: {
    ticketId: number
    ticketProcedureId: number
    ticketUserResultList: TicketUser[]
  }) {
    const { ticketId, ticketProcedureId } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/procedure/update-user-result-ticket-procedure/${ticketProcedureId}`,
      {
        ticketUserResultList: body.ticketUserResultList
          .filter((i) => !!i.userId)
          .map((i) => ({
            positionId: i.positionId,
            userId: i.userId,
          })),
      },
    )
    const { data } = response.data as BaseResponse<{ ticketProcedureModified: any }>
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
    const { data } = response.data as BaseResponse<{ ticketProcedureList: any[] }>
  }

  static async updateMoneyTicketRegimen(body: {
    ticketId: number
    ticketRegimenId: number
    ticketRegimen: TicketRegimen
    ticketProcedureList: TicketProcedure[]
  }) {
    const { ticketId, ticketRegimenId, ticketRegimen, ticketProcedureList } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/procedure/update-money-ticket-regimen/${ticketRegimenId}`,
      {
        ticketRegimen: {
          expectedPrice: ticketRegimen.expectedPrice,
          discountMoney: ticketRegimen.discountMoney,
          discountPercent: ticketRegimen.discountPercent,
          discountType: ticketRegimen.discountType,
          actualPrice: ticketRegimen.actualPrice,
        },
        ticketProcedureList: ticketProcedureList.map((i, index) => ({
          id: i.id || 0,
          quantity: i.quantity,

          expectedPrice: i.expectedPrice,
          discountMoney: i.discountMoney,
          discountPercent: i.discountPercent,
          discountType: i.discountType,
          actualPrice: i.actualPrice,
        })),
      },
    )
    const { data } = response.data as BaseResponse<{ ticketRegimenModified: any }>
    return TicketRegimen.from(data.ticketRegimenModified)
  }

  static async updateUserRequestTicketRegimen(body: {
    ticketId: number
    ticketRegimenId: number
    ticketUserRequestList: TicketUser[]
  }) {
    const { ticketId, ticketRegimenId, ticketUserRequestList } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/procedure/update-user-request-ticket-regimen/${ticketRegimenId}`,
      {
        ticketUserRequestList: ticketUserRequestList
          .filter((i) => !!i.userId)
          .map((i) => ({
            positionId: i.positionId,
            userId: i.userId,
          })),
      },
    )
    const { data } = response.data as BaseResponse<{ ticketRegimenModified: any }>
  }

  static async updateResultTicketProcedure(options: {
    ticketId: number
    ticketProcedureId: number
    ticketProcedure: {
      completedAt: number
      result: string
    }
    imagesChange?: {
      files: File[]
      imageIdsWait: number[]
      externalUrlList: string[]
    }
  }) {
    const { ticketId, ticketProcedureId, ticketProcedure, imagesChange } = options

    const formData = new FormData()

    if (imagesChange) {
      // imagesChange.files.forEach((file) => formData.append('files', file))
      const imagesChangeStr = JSON.stringify({
        imageIdsWait: imagesChange.imageIdsWait,
        externalUrlList: imagesChange.externalUrlList,
      })
      formData.append('imagesChange', imagesChangeStr)
    }

    formData.append('ticketProcedure', JSON.stringify(ticketProcedure))

    const response = await AxiosInstance.post(
      `ticket/${ticketId}/procedure/update-result-ticket-procedure/${ticketProcedureId}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    )
    const { data } = response.data as BaseResponse<{ ticketProcedureModified: any }>

    return TicketProcedure.from(data.ticketProcedureModified)
  }

  static async cancelResultTicketProcedure(body: { ticketId: number; ticketProcedureId: number }) {
    const { ticketId, ticketProcedureId } = body
    const response = await AxiosInstance.post(
      `ticket/${ticketId}/procedure/cancel-result-ticket-procedure/${ticketProcedureId}`,
    )
    const { data } = response.data as BaseResponse<{ ticketProcedureModified: any }>

    return TicketProcedure.from(data.ticketProcedureModified)
  }
}
