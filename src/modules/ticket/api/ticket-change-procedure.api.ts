import type { TicketProduct } from '@/modules/ticket-product'
import { TicketRegimen, TicketRegimenItem } from '@/modules/ticket-regimen'
import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import { TicketProcedure } from '../../ticket-procedure'
import { TicketUser } from '../../ticket-user'

export class TicketChangeProcedureApi {
  static async addTicketProcedureList(obj: {
    ticketId: string
    ticketRegimenWrapList: {
      ticketRegimenAdd: TicketRegimen
      ticketUserRequestAddList: TicketUser[]
      ticketRegimenItemAddList: TicketRegimenItem[]
    }[]
    ticketProcedureWrapList: {
      ticketProcedureAdd: TicketProcedure
      ticketUserRequestAddList: TicketUser[]
    }[]
  }) {
    const { ticketId, ticketRegimenWrapList, ticketProcedureWrapList } = obj
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/procedure/add-ticket-procedure-list`,
      {
        ticketRegimenWrapList: ticketRegimenWrapList.map((trWrap) => {
          const { ticketRegimenAdd, ticketRegimenItemAddList, ticketUserRequestAddList } = trWrap
          return {
            ticketRegimenAdd: {
              regimenId: ticketRegimenAdd.regimenId,

              expectedMoney: ticketRegimenAdd.expectedMoney,
              actualMoney: ticketRegimenAdd.actualMoney,
              discountMoney: ticketRegimenAdd.discountMoney,
              discountPercent: ticketRegimenAdd.discountPercent,
              discountType: ticketRegimenAdd.discountType,
            },
            ticketRegimenItemAddList: (ticketRegimenItemAddList || [])
              .filter((tri) => tri.quantityExpected > 0)
              .map((tri, index) => {
                return {
                  procedureId: tri.procedureId,
                  gapDay: tri.gapDay,

                  quantityExpected: tri.quantityExpected,

                  expectedMoneyAmount: tri.expectedMoneyAmount,
                  discountMoneyAmount: tri.discountMoneyAmount,
                  discountPercent: tri.discountPercent,
                  discountType: tri.discountType,
                  actualMoneyAmount: tri.actualMoneyAmount,
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
        ticketProcedureWrapList: ticketProcedureWrapList.map((tp) => {
          const { ticketProcedureAdd, ticketUserRequestAddList } = tp
          return {
            ticketProcedureAdd: {
              priority: ticketProcedureAdd.priority,
              procedureId: ticketProcedureAdd.procedureId,
              status: ticketProcedureAdd.status,

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

  static async destroyTicketProcedure(body: { ticketId: string; ticketProcedureId: string }) {
    const { ticketId, ticketProcedureId } = body
    const response = await AxiosInstance.delete(
      `/ticket/${ticketId}/procedure/destroy-ticket-procedure/${ticketProcedureId}`,
    )
    const { data } = response.data as BaseResponse<{ ticketId: any; ticketProcedureId: string }>
  }

  static async destroyTicketRegimen(body: { ticketId: string; ticketRegimenId: string }) {
    const { ticketId, ticketRegimenId } = body
    const response = await AxiosInstance.delete(
      `/ticket/${ticketId}/procedure/destroy-ticket-regimen/${ticketRegimenId}`,
    )
    const { data } = response.data as BaseResponse<{ ticketId: any; ticketRegimenId: string }>
  }

  static async updateMoneyTicketProcedure(body: {
    ticketId: string
    ticketProcedureId: string
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

  static async updateUserTicketProcedure(body: {
    ticketId: string
    ticketProcedureId: string
    ticketUserRequestList: TicketUser[]
    ticketUserResultList: TicketUser[]
  }) {
    const { ticketId, ticketProcedureId } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/procedure/update-user-ticket-procedure/${ticketProcedureId}`,
      {
        ticketUserRequestList: body.ticketUserRequestList
          .filter((i) => !!i.userId)
          .map((i) => ({
            positionId: i.positionId,
            userId: i.userId,
          })),
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
    ticketId: string
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
    ticketId: string
    ticketRegimenId: string
    ticketRegimen: TicketRegimen
    ticketRegimenItemList: TicketRegimenItem[]
  }) {
    const { ticketId, ticketRegimenId, ticketRegimen, ticketRegimenItemList } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/procedure/update-money-ticket-regimen/${ticketRegimenId}`,
      {
        ticketRegimenUpdate: {
          expectedMoney: ticketRegimen.expectedMoney,
          discountMoney: ticketRegimen.discountMoney,
          discountPercent: ticketRegimen.discountPercent,
          discountType: ticketRegimen.discountType,
          actualMoney: ticketRegimen.actualMoney,
        },
        ticketRegimenItemUpdateList: ticketRegimenItemList.map((i) => {
          return {
            id: i.id,
            quantityExpected: i.quantityExpected,
            expectedMoneyAmount: i.expectedMoneyAmount,
            discountMoneyAmount: i.discountMoneyAmount,
            discountPercent: i.discountPercent,
            discountType: i.discountType,
            actualMoneyAmount: i.actualMoneyAmount,
          }
        }),
      },
    )
    const { data } = response.data as BaseResponse<any>
  }

  static async updateUserRequestTicketRegimen(body: {
    ticketId: string
    ticketRegimenId: string
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

  static async processResultTicketProcedure(options: {
    ticketId: string
    ticketProcedureResult: TicketProcedure
    ticketUserResultList: TicketUser[]
    ticketProductProcedureResultList: TicketProduct[]
    imagesChange?: {
      files: File[]
      imageIdWaitList: number[]
      externalUrlList: string[]
    }
  }) {
    const {
      ticketId,
      imagesChange,
      ticketProcedureResult,
      ticketUserResultList,
      ticketProductProcedureResultList,
    } = options

    const formData = new FormData()

    if (imagesChange) {
      // imagesChange.files.forEach((file) => formData.append('files', file))
      const imagesChangeStr = JSON.stringify({
        imageIdWaitList: imagesChange.imageIdWaitList,
        externalUrlList: imagesChange.externalUrlList,
      })
      formData.append('imagesChange', imagesChangeStr)
    }

    formData.append(
      'ticketProcedureResult',
      JSON.stringify({
        ticketProcedureId: ticketProcedureResult.id,
        quantity: ticketProcedureResult.quantity,
        completedAt: ticketProcedureResult.completedAt,
        result: ticketProcedureResult.result || '',
      }),
    )

    formData.append(
      'ticketUserResultList',
      JSON.stringify(
        ticketUserResultList
          .filter((i) => !!i.userId)
          .map((i) => ({
            positionId: i.positionId,
            userId: i.userId,
          })),
      ),
    )

    formData.append(
      'ticketProductProcedureResultList',
      JSON.stringify(
        ticketProductProcedureResultList.map((i) => {
          return {
            quantity: i.quantity,
            productId: i.productId,
            pickupStrategy: i.pickupStrategy,
            warehouseIds: i.warehouseIds,
          }
        }),
      ),
    )

    const response = await AxiosInstance.post(
      `ticket/${ticketId}/procedure/process-result-ticket-procedure`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    )
    const { data } = response.data as BaseResponse<any>
    return data
  }

  static async cancelResultTicketProcedure(body: { ticketId: string; ticketProcedureId: string }) {
    const { ticketId, ticketProcedureId } = body
    const response = await AxiosInstance.post(
      `ticket/${ticketId}/procedure/cancel-result-ticket-procedure/${ticketProcedureId}`,
    )
    const { data } = response.data as BaseResponse<any>

    return data
  }
}
