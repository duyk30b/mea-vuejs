import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  TicketParaclinicalDetailQuery,
  TicketParaclinicalGetQuery,
  type TicketParaclinicalPaginationQuery,
} from './ticket-paraclinical.dto'
import { TicketParaclinical } from './ticket-paraclinical.model'

export class TicketParaclinicalApi {
  static async pagination(options: TicketParaclinicalPaginationQuery) {
    const params = TicketParaclinicalGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/ticket-paraclinical/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: TicketParaclinical.fromList(data),
    }
  }

  static async detail(id: number, options: TicketParaclinicalDetailQuery) {
    const params = TicketParaclinicalGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/ticket-paraclinical/detail/${id}`, { params })
    const { data } = response.data as BaseResponse<{ ticketParaclinical: any }>
    return TicketParaclinical.from(data.ticketParaclinical)
  }

  static async createCompleted(options: { ticketParaclinical: TicketParaclinical; files: File[] }) {
    const { ticketParaclinical, files } = options

    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('ticketId', ticketParaclinical.ticketId.toString())
    formData.append('customerId', ticketParaclinical.customerId.toString())
    formData.append('paraclinicalId', ticketParaclinical.paraclinicalId.toString())
    formData.append('expectedPrice', ticketParaclinical.expectedPrice.toString())
    formData.append('discountMoney', ticketParaclinical.discountMoney.toString())
    formData.append('discountPercent', ticketParaclinical.discountPercent.toString())
    formData.append('discountType', ticketParaclinical.discountType)
    formData.append('actualPrice', ticketParaclinical.actualPrice.toString())
    formData.append('description', ticketParaclinical.description)
    formData.append('result', ticketParaclinical.result)
    formData.append('startedAt', ticketParaclinical.startedAt.toString())

    const response = await AxiosInstance.post(`/ticket-paraclinical/create-completed`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    const { data } = response.data as BaseResponse<{ ticketParaclinicalId: number }>
    return data
  }

  static async update(options: {
    ticketParaclinical: TicketParaclinical
    imageIdsKeep: number[]
    files: File[]
    filesPosition: number[]
  }) {
    const { ticketParaclinical, imageIdsKeep, files, filesPosition } = options

    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('description', ticketParaclinical.description)
    formData.append('result', ticketParaclinical.result)
    formData.append('startedAt', ticketParaclinical.startedAt.toString())
    formData.append('imageIdsKeep', JSON.stringify(imageIdsKeep))
    formData.append('filesPosition', JSON.stringify(filesPosition))

    const response = await AxiosInstance.post(
      `/ticket-paraclinical/update/${ticketParaclinical.id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    const { data } = response.data as BaseResponse<{ ticketParaclinicalId: number }>
    return data
  }
}
