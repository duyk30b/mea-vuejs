import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  TicketProcedureGetQuery,
  type TicketProcedurePaginationQuery,
} from './ticket-procedure.dto'
import { TicketProcedure } from './ticket-procedure.model'

export class TicketProcedureApi {
  static async pagination(options: TicketProcedurePaginationQuery) {
    const params = TicketProcedureGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/ticket-procedure/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: TicketProcedure.fromList(data),
    }
  }
}
