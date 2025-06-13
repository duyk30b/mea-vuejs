import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { TicketUser } from '../ticket-user'
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

  static async updateResult(options: {
    ticketRadiologyId: number
    ticketRadiology: TicketRadiology
    imageIdsKeep: number[]
    files: File[]
    filesPosition: number[]
    ticketUserList?: TicketUser[]
    response: {
      ticketRadiology: {
        ticket?: boolean
        customer?: boolean
        ticketUserList?: boolean
        imageList?: boolean
      }
    }
  }) {
    const { ticketRadiologyId, ticketRadiology, imageIdsKeep, files, filesPosition } = options

    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('imageIdsKeep', JSON.stringify(imageIdsKeep))
    formData.append('filesPosition', JSON.stringify(filesPosition))
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
      `/ticket-radiology/update-result/${ticketRadiologyId}`,
      formData,
      {
        params: { response: JSON.stringify(options.response) },
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    )
    const { data } = response.data as BaseResponse<{ ticketRadiology: any }>
    return TicketRadiology.from(data.ticketRadiology)
  }

  static async cancelResult(
    ticketRadiologyId: number,
    body: {
      printHtmlId: number
      description: string
      result: string
      customStyles: string
      customVariables: string
    },
  ) {
    const response = await AxiosInstance.post(
      `/ticket-radiology/cancel-result/${ticketRadiologyId}`,
      body,
    )
    const { data } = response.data as BaseResponse<{ ticketRadiology: any }>
    return TicketRadiology.from(data.ticketRadiology)
  }
}
