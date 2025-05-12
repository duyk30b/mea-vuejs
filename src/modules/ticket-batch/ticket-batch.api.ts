import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
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
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: TicketBatch.fromList(data),
    }
  }

  static async list(options: TicketBatchListQuery) {
    const params = TicketBatchGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/ticket-batch/list', { params })
    const { data, time } = response.data as BaseResponse<{ ticketBatchList: any }>
    return TicketBatch.fromList(data.ticketBatchList)
  }
}
