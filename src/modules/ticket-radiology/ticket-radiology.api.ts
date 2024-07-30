import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  TicketRadiologyDetailQuery,
  TicketRadiologyGetQuery,
  type TicketRadiologyPaginationQuery,
} from './ticket-radiology.dto'
import { TicketRadiology } from './ticket-radiology.model'

export class TicketRadiologyApi {
  static async pagination(options: TicketRadiologyPaginationQuery) {
    const params = TicketRadiologyGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/ticket-radiology/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: TicketRadiology.fromList(data),
    }
  }

  static async detail(id: number, options: TicketRadiologyDetailQuery) {
    const params = TicketRadiologyGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/ticket-radiology/detail/${id}`, { params })
    const { data } = response.data as BaseResponse<{ ticketRadiology: any }>
    return TicketRadiology.from(data.ticketRadiology)
  }

  static async createCompleted(options: { ticketRadiology: TicketRadiology; files: File[] }) {
    const { ticketRadiology, files } = options

    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('ticketId', ticketRadiology.ticketId.toString())
    formData.append('customerId', ticketRadiology.customerId.toString())
    formData.append('radiologyId', ticketRadiology.radiologyId.toString())
    formData.append('expectedPrice', ticketRadiology.expectedPrice.toString())
    formData.append('discountMoney', ticketRadiology.discountMoney.toString())
    formData.append('discountPercent', ticketRadiology.discountPercent.toString())
    formData.append('discountType', ticketRadiology.discountType)
    formData.append('actualPrice', ticketRadiology.actualPrice.toString())
    formData.append('description', ticketRadiology.description)
    formData.append('result', ticketRadiology.result)
    formData.append('startedAt', ticketRadiology.startedAt.toString())

    const response = await AxiosInstance.post(`/ticket-radiology/create-completed`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    const { data } = response.data as BaseResponse<{ ticketRadiologyId: number }>
    return data
  }

  static async updateResult(options: {
    ticketRadiology: TicketRadiology
    imageIdsKeep: number[]
    files: File[]
    filesPosition: number[]
  }) {
    const { ticketRadiology, imageIdsKeep, files, filesPosition } = options

    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('description', ticketRadiology.description)
    formData.append('result', ticketRadiology.result)
    formData.append('startedAt', ticketRadiology.startedAt.toString())
    formData.append('imageIdsKeep', JSON.stringify(imageIdsKeep))
    formData.append('filesPosition', JSON.stringify(filesPosition))

    const response = await AxiosInstance.post(
      `/ticket-radiology/${ticketRadiology.id}/update-result`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    const { data } = response.data as BaseResponse<{ ticketRadiologyId: number }>
    return data
  }

  static async cancelResult(id: number) {
    const response = await AxiosInstance.post(`/ticket-radiology/${id}/cancel-result`)
    const { data } = response.data as BaseResponse<{ ticketId: number }>
    return data
  }
}
