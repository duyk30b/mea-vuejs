import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { TicketLaboratoryResult } from '../ticket-laboratory-result'
import {
  TicketLaboratoryGroupDetailQuery,
  TicketLaboratoryGroupGetQuery,
  type TicketLaboratoryGroupPaginationQuery,
} from './ticket-laboratory-group.dto'
import { TicketLaboratoryGroup } from './ticket-laboratory-group.model'

export class TicketLaboratoryGroupApi {
  static async pagination(options: TicketLaboratoryGroupPaginationQuery) {
    const params = TicketLaboratoryGroupGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/ticket-laboratory-group/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: TicketLaboratoryGroup.fromList(data),
    }
  }

  static async detail(id: number, options: TicketLaboratoryGroupDetailQuery) {
    const params = TicketLaboratoryGroupGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/ticket-laboratory-group/detail/${id}`, { params })
    const { data } = response.data as BaseResponse<{ ticketLaboratoryGroup: any }>
    return TicketLaboratoryGroup.from(data.ticketLaboratoryGroup)
  }

  static async updateResult(options: {
    ticketLaboratoryGroupId: number
    startedAt: number
    ticketLaboratoryResultUpdateList: TicketLaboratoryResult[]
    response: {
      ticketLaboratoryGroup: {
        ticket?: boolean
        customer?: boolean
        ticketUserList?: boolean
        imageList?: boolean
        ticketLaboratoryList?: boolean
        ticketLaboratoryResultMap?: boolean
      }
    }
  }) {
    const { ticketLaboratoryGroupId } = options
    const response = await AxiosInstance.post(
      `/ticket-laboratory-group/update-result/${ticketLaboratoryGroupId}`,
      {
        startedAt: options.startedAt,
        ticketLaboratoryResultUpdateList: options.ticketLaboratoryResultUpdateList.map((i) => {
          return {
            id: i.id,
            laboratoryId: i.laboratoryId,
            ticketLaboratoryId: i.ticketLaboratoryId,
            attention: i.attention,
            result: i.result,
          }
        }),
      },
      { params: { response: JSON.stringify(options.response) } },
    )
    const { data } = response.data as BaseResponse<{ ticketLaboratoryGroup: any }>
    return TicketLaboratoryGroup.from(data.ticketLaboratoryGroup)
  }

  static async cancelResult(body: { ticketLaboratoryGroupId: number }) {
    const { ticketLaboratoryGroupId } = body
    const response = await AxiosInstance.post(
      `/ticket-laboratory-group/cancel-result/${ticketLaboratoryGroupId}`,
    )
    const { data } = response.data as BaseResponse
    return data
  }
}
