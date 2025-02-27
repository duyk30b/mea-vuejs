import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { TicketRadiology } from '../ticket-radiology'
import type { TicketUser } from '../ticket-user'

export class TicketClinicRadiologyApi {
  static async addTicketRadiology(body: { ticketId: number; ticketRadiology: TicketRadiology }) {
    const { ticketId, ticketRadiology } = body
    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/add-ticket-radiology`, {
      priority: ticketRadiology.priority,
      customerId: ticketRadiology.customerId,
      radiologyId: ticketRadiology.radiologyId,
      costPrice: ticketRadiology.costPrice,
      expectedPrice: ticketRadiology.expectedPrice,
      discountMoney: ticketRadiology.discountMoney,
      discountPercent: ticketRadiology.discountPercent,
      discountType: ticketRadiology.discountType,
      actualPrice: ticketRadiology.actualPrice,
    })
    const { data } = response.data as BaseResponse<boolean>
  }

  static async destroyTicketRadiology(body: { ticketId: number; ticketRadiologyId: number }) {
    const { ticketId, ticketRadiologyId } = body
    const response = await AxiosInstance.delete(
      `/ticket-clinic/${ticketId}/destroy-ticket-radiology/${ticketRadiologyId}`
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
      `/ticket-clinic/${ticketId}/update-money-ticket-radiology/${ticketRadiologyId}`,
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
              roleId: i.roleId || 0,
              userId: i.userId || 0,
            }))
          : undefined,
      }
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updateResultTicketRadiology(options: {
    ticketId: number
    ticketRadiologyId: number
    ticketRadiology: TicketRadiology
    imageIdsKeep: number[]
    files: File[]
    filesPosition: number[]
    ticketUserList?: TicketUser[]
  }) {
    const { ticketId, ticketRadiologyId, ticketRadiology, imageIdsKeep, files, filesPosition } =
      options

    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('imageIdsKeep', JSON.stringify(imageIdsKeep))
    formData.append('filesPosition', JSON.stringify(filesPosition))
    formData.append(
      'ticketRadiology',
      JSON.stringify({
        description: ticketRadiology.description,
        result: ticketRadiology.result,
        startedAt: ticketRadiology.startedAt,
      })
    )
    if (options.ticketUserList) {
      formData.append(
        'ticketUserList',
        JSON.stringify(
          options.ticketUserList.map((i) => ({
            roleId: i.roleId || 0,
            userId: i.userId || 0,
          }))
        )
      )
    }

    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-result-ticket-radiology/${ticketRadiologyId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updatePriorityTicketRadiology(body: {
    ticketId: number
    ticketRadiologyList: TicketRadiology[]
  }) {
    const { ticketId, ticketRadiologyList } = body
    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-priority-ticket-radiology`,
      {
        ticketRadiologyList: ticketRadiologyList.map((i, index) => ({
          id: i.id,
          priority: index + 1,
        })),
      }
    )
    const { data } = response.data as BaseResponse<boolean>
  }
}
