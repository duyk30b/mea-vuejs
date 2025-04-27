import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  TicketLaboratoryGroupDetailQuery,
  TicketLaboratoryGroupGetQuery,
  type TicketLaboratoryGroupPaginationQuery,
} from './ticket-laboratory-group.dto'
import { TicketLaboratoryGroup } from './ticket-laboratory-group.model'

export class TicketLaboratoryGroupApi {
  static async pagination(options: TicketLaboratoryGroupPaginationQuery) {
    const params = TicketLaboratoryGroupGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/ticket-laboratory/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: TicketLaboratoryGroup.fromList(data),
    }
  }

  static async detail(id: number, options: TicketLaboratoryGroupDetailQuery) {
    const params = TicketLaboratoryGroupGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/ticket-laboratory/detail/${id}`, { params })
    const { data } = response.data as BaseResponse<{ ticketLaboratory: any }>
    return TicketLaboratoryGroup.from(data.ticketLaboratory)
  }
}
