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
}
