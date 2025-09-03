import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import { TicketRadiology } from '../../ticket-radiology'
import type { TicketUser } from '../../ticket-user'

export class TicketChangeRadiologyApi {
  static async addTicketRadiology(obj: {
    ticketId: number
    ticketRadiologyWrapList: {
      ticketRadiology: TicketRadiology
      ticketUserRequestList: TicketUser[]
    }[]
  }) {
    const { ticketId, ticketRadiologyWrapList } = obj
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/radiology/add-ticket-radiology-list`,

      {
        ticketRadiologyWrapList: ticketRadiologyWrapList.map((tp) => {
          const { ticketRadiology, ticketUserRequestList } = tp
          return {
            ticketUserRequestList: (ticketUserRequestList || [])
              .filter((i) => !!i.userId)
              .map((i) => ({
                positionId: i.positionId,
                userId: i.userId,
              })),
            ticketRadiology: {
              priority: ticketRadiology.priority,
              radiologyId: ticketRadiology.radiologyId,
              customerId: ticketRadiology.customerId,
              roomId: ticketRadiology.roomId,

              paymentMoneyStatus: ticketRadiology.paymentMoneyStatus,
              createdAt: ticketRadiology.createdAt,

              costPrice: ticketRadiology.costPrice,
              expectedPrice: ticketRadiology.expectedPrice,
              discountMoney: ticketRadiology.discountMoney,
              discountPercent: ticketRadiology.discountPercent,
              discountType: ticketRadiology.discountType,
              actualPrice: ticketRadiology.actualPrice,

              printHtmlId: ticketRadiology.printHtmlId,
              description: ticketRadiology.description,
              result: ticketRadiology.result,
              customStyles: ticketRadiology.customStyles,
              customVariables: ticketRadiology.customVariables,
            },
          }
        }),
      },
    )
    const { data } = response.data as BaseResponse<{ ticketRadiologyCreatedList: any[] }>
    return TicketRadiology.fromList(data.ticketRadiologyCreatedList)
  }

  static async destroyTicketRadiology(body: { ticketId: number; ticketRadiologyId: number }) {
    const { ticketId, ticketRadiologyId } = body
    const response = await AxiosInstance.delete(
      `/ticket/${ticketId}/radiology/destroy-ticket-radiology/${ticketRadiologyId}`,
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updateTicketRadiology(body: {
    ticketId: number
    ticketRadiologyId: number
    ticketRadiology?: TicketRadiology
    ticketUserRequestList?: TicketUser[]
  }) {
    const { ticketId, ticketRadiology, ticketRadiologyId, ticketUserRequestList } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/radiology/update-ticket-radiology/${ticketRadiologyId}`,
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
    const { data } = response.data as BaseResponse<{ ticketRadiologyModified: any }>
    return TicketRadiology.from(data.ticketRadiologyModified)
  }

  static async updatePriorityTicketRadiology(body: {
    ticketId: number
    ticketRadiologyList: TicketRadiology[]
  }) {
    const { ticketId, ticketRadiologyList } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/radiology/update-priority-ticket-radiology`,
      {
        ticketRadiologyList: ticketRadiologyList.map((i, index) => ({
          id: i.id,
          priority: index + 1,
        })),
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updateResult(options: {
    ticketId: number
    ticketRadiologyId: number
    ticketRadiology: TicketRadiology
    ticketUserResultList?: TicketUser[]
    imagesChange?: {
      files: File[]
      imageIdsWait: number[]
      externalUrlList: string[]
    }
  }) {
    const { ticketId, ticketRadiologyId, ticketRadiology, imagesChange } = options

    const formData = new FormData()
    if (imagesChange) {
      // imagesChange.files.forEach((file) => formData.append('files', file))
      const imagesChangeStr = JSON.stringify({
        imageIdsWait: imagesChange.imageIdsWait,
        externalUrlList: imagesChange.externalUrlList,
      })
      formData.append('imagesChange', imagesChangeStr)
    }
    formData.append(
      'ticketRadiology',
      JSON.stringify({
        completedAt: ticketRadiology.completedAt,
        printHtmlId: ticketRadiology.printHtmlId,
        description: ticketRadiology.description,
        result: ticketRadiology.result,
        customStyles: ticketRadiology.customStyles,
        customVariables: ticketRadiology.customVariables,
      }),
    )
    if (options.ticketUserResultList) {
      formData.append(
        'ticketUserResultList',
        JSON.stringify(
          options.ticketUserResultList
            .filter((i) => !!i.userId)
            .map((i) => ({
              positionId: i.positionId,
              userId: i.userId,
            })),
        ),
      )
    }

    const response = await AxiosInstance.post(
      `ticket/${ticketId}/radiology/update-result/${ticketRadiologyId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    const { data } = response.data as BaseResponse<{ ticketRadiologyModified: any }>
    return TicketRadiology.from(data.ticketRadiologyModified)
  }

  static async cancelResult(object: {
    ticketId: number
    ticketRadiologyId: number
    body: {
      printHtmlId: number
      description: string
      result: string
      customStyles: string
      customVariables: string
    }
  }) {
    const { ticketId, ticketRadiologyId, body } = object
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/radiology/cancel-result/${ticketRadiologyId}`,
      body,
    )
    const { data } = response.data as BaseResponse<{ ticketRadiologyModified: any }>
    return TicketRadiology.from(data.ticketRadiologyModified)
  }
}
