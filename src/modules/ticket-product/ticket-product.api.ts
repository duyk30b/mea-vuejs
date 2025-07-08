import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  TicketProductGetQuery,
  TicketProductListQuery,
  type TicketProductPaginationQuery,
} from './ticket-product.dto'
import { TicketProduct } from './ticket-product.model'

export class TicketProductApi {
  static async pagination(query: TicketProductPaginationQuery) {
    const params = TicketProductGetQuery.toQuery(query)

    const response = await AxiosInstance.get('/ticket-product/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: TicketProduct.fromList(data),
    }
  }

  static async list(query: TicketProductListQuery) {
    const params = TicketProductGetQuery.toQuery(query)

    const response = await AxiosInstance.get('/ticket-product/list', { params })
    const { data } = response.data as BaseResponse<{ ticketProductList: any[] }>
    return TicketProduct.fromList(data.ticketProductList)
  }
}
