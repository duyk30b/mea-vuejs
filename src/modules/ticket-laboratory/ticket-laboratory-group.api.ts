import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
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
    const { data, meta } = response.data as FullResponse
    return {
      page: data.page,
      limit: data.limit,
      total: data.total,
      ticketLaboratoryGroupList: TicketLaboratoryGroup.fromList(data.ticketLaboratoryGroupList),
    }
  }

  static async detail(ticketLaboratoryGroupId: string, options: TicketLaboratoryGroupDetailQuery) {
    const params = TicketLaboratoryGroupGetQuery.toQuery(options)

    const response = await AxiosInstance.get(
      `/ticket-laboratory-group/detail/${ticketLaboratoryGroupId}`,
      { params },
    )
    const { data } = response.data as FullResponse<{ ticketLaboratoryGroup: any }>
    return TicketLaboratoryGroup.from(data.ticketLaboratoryGroup)
  }
}
