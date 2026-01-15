import { AxiosInstance } from '../../core/axios.instance'
import type { FullResponse } from '../_base/base-dto'
import {
  TicketBatchGetQuery,
  TicketBatchListQuery,
  type TicketBatchPaginationQuery,
} from './ticket-batch.dto'
import { TicketBatch } from './ticket-batch.model'

export class TicketBatchApi {
  static async pagination(options: TicketBatchPaginationQuery) {
    const params = TicketBatchGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/ticket-batch/pagination', { params })
    const { data, meta } = response.data as FullResponse
    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      ticketBatchList: TicketBatch.fromList(data.ticketBatchList),
    }
  }

  static async list(options: TicketBatchListQuery) {
    const params = TicketBatchGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/ticket-batch/list', { params })
    const { data, time } = response.data as FullResponse<{ ticketBatchList: any }>
    return TicketBatch.fromList(data.ticketBatchList)
  }
}
