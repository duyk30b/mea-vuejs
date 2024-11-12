import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { TicketProductGetQuery, type TicketProductPaginationQuery } from './ticket-product.dto'
import { TicketProduct } from './ticket-product.model'

export class TicketProductApi {
  static async pagination(options: TicketProductPaginationQuery) {
    const params = TicketProductGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/ticket-product/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: TicketProduct.fromList(data),
    }
  }

  static async destroyZeroQuantity(id: number) {
    const response = await AxiosInstance.delete(`/ticket-product/destroy-zero/${id}`)
    const { data, meta } = response.data as BaseResponse<{ ticketProductId: number }>
    return data.ticketProductId
  }
}
