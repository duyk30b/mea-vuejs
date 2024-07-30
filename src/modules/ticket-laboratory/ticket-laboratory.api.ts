import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  TicketLaboratoryDetailQuery,
  TicketLaboratoryGetQuery,
  type TicketLaboratoryPaginationQuery,
} from './ticket-laboratory.dto'
import { TicketLaboratory } from './ticket-laboratory.model'

export class TicketLaboratoryApi {
  static async pagination(options: TicketLaboratoryPaginationQuery) {
    const params = TicketLaboratoryGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/ticket-laboratory/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: TicketLaboratory.fromList(data),
    }
  }

  static async detail(id: number, options: TicketLaboratoryDetailQuery) {
    const params = TicketLaboratoryGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/ticket-laboratory/detail/${id}`, { params })
    const { data } = response.data as BaseResponse<{ ticketLaboratory: any }>
    return TicketLaboratory.from(data.ticketLaboratory)
  }

  static async createCompleted(ticketLaboratory: TicketLaboratory) {
    const response = await AxiosInstance.post(`/ticket-laboratory/create-completed`, {
      ticketId: ticketLaboratory.ticketId,
      customerId: ticketLaboratory.customerId,
      laboratoryId: ticketLaboratory.laboratoryId,

      expectedPrice: ticketLaboratory.expectedPrice,
      discountMoney: ticketLaboratory.discountMoney,
      discountPercent: ticketLaboratory.discountPercent,
      discountType: ticketLaboratory.discountType,
      actualPrice: ticketLaboratory.actualPrice,

      attention: ticketLaboratory.attention,
      result: ticketLaboratory.result,

      startedAt: ticketLaboratory.startedAt,
    })
    const { data } = response.data as BaseResponse<{ ticketLaboratoryId: number }>
    return data
  }

  static async updateResult(body: {
    ticketId: number
    customerId: number
    startedAt: number
    ticketLaboratoryCreateList: TicketLaboratory[]
    ticketLaboratoryUpdateList: TicketLaboratory[]
  }) {
    const response = await AxiosInstance.post(`/ticket-laboratory/update-result`, {
      ticketId: body.ticketId,
      customerId: body.customerId,
      startedAt: body.startedAt,
      ticketLaboratoryCreateList: body.ticketLaboratoryCreateList.map((i) => {
        return {
          laboratoryId: i.laboratoryId,
          expectedPrice: i.expectedPrice,
          discountMoney: i.discountMoney,
          discountPercent: i.discountPercent,
          discountType: i.discountType,
          actualPrice: i.actualPrice,
          attention: i.attention,
          result: i.result,
        }
      }),
      ticketLaboratoryUpdateList: body.ticketLaboratoryUpdateList.map((i) => {
        return {
          id: i.id,
          attention: JSON.stringify(i.attentionParse),
          result: JSON.stringify(i.resultParse),
        }
      }),
    })
    const { data } = response.data as BaseResponse<{ ticketId: number }>
    return data
  }

  static async cancelResult(id: number) {
    const response = await AxiosInstance.post(`/ticket-laboratory/${id}/cancel-result`)
    const { data } = response.data as BaseResponse<{ ticketId: number }>
    return data
  }
}
