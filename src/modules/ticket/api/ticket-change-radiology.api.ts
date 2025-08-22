import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import { TicketRadiology } from '../../ticket-radiology'
import type { TicketUser } from '../../ticket-user'

export class TicketChangeRadiologyApi {
  static async addTicketRadiology(body: { ticketId: number; ticketRadiology: TicketRadiology }) {
    const { ticketId, ticketRadiology } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/radiology/add-ticket-radiology`,
      {
        priority: ticketRadiology.priority,
        roomId: ticketRadiology.roomId,
        customerId: ticketRadiology.customerId,
        radiologyId: ticketRadiology.radiologyId,

        paymentMoneyStatus: ticketRadiology.paymentMoneyStatus,

        registeredAt: ticketRadiology.registeredAt,
        costPrice: ticketRadiology.costPrice,
        expectedPrice: ticketRadiology.expectedPrice,
        discountMoney: ticketRadiology.discountMoney,
        discountPercent: ticketRadiology.discountPercent,
        discountType: ticketRadiology.discountType,
        actualPrice: ticketRadiology.actualPrice,

        printHtmlId: ticketRadiology.printHtmlId,
        result: ticketRadiology.result,
        description: ticketRadiology.description,
        customStyles: ticketRadiology.customStyles,
        customVariables: ticketRadiology.customVariables,
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async destroyTicketRadiology(body: { ticketId: number; ticketRadiologyId: number }) {
    const { ticketId, ticketRadiologyId } = body
    const response = await AxiosInstance.delete(
      `/ticket/${ticketId}/radiology/destroy-ticket-radiology/${ticketRadiologyId}`,
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updateMoneyTicketRadiology(body: {
    ticketId: number
    ticketRadiologyId: number
    ticketRadiology?: TicketRadiology
    ticketUserList?: TicketUser[]
  }) {
    const { ticketId, ticketRadiology, ticketRadiologyId, ticketUserList } = body
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/radiology/update-money-ticket-radiology/${ticketRadiologyId}`,
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
    ticketUserList?: TicketUser[]
    imagesChange?: {
      files: File[]
      imageIdsWait: number[]
      externalUrlList: string[]
    }
    response: {
      ticketRadiology: {
        ticket?: boolean
        customer?: boolean
        ticketUserList?: boolean
        imageList?: boolean
      }
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
        startedAt: ticketRadiology.startedAt,
        printHtmlId: ticketRadiology.printHtmlId,
        description: ticketRadiology.description,
        result: ticketRadiology.result,
        customStyles: ticketRadiology.customStyles,
        customVariables: ticketRadiology.customVariables,
      }),
    )
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
      `ticket/${ticketId}/radiology/update-result/${ticketRadiologyId}`,
      formData,
      {
        params: { response: JSON.stringify(options.response) },
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    )
    const { data } = response.data as BaseResponse<{ ticketRadiology: any }>
    return TicketRadiology.from(data.ticketRadiology)
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
    const { data } = response.data as BaseResponse<{ ticketRadiology: any }>
    return TicketRadiology.from(data.ticketRadiology)
  }
}
