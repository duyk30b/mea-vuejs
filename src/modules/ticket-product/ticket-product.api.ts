import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import {
  TicketProductGetQuery,
  TicketProductListQuery,
  type TicketProductPaginationQuery
} from './ticket-product.dto'
import { TicketProduct } from './ticket-product.model'

export class TicketProductApi {
  static async pagination(query: TicketProductPaginationQuery) {
    const params = TicketProductGetQuery.toQuery(query)

    const response = await AxiosInstance.get('/ticket-product/pagination', { params })
    const { data } = response.data as BaseResponse
    return {
      page: data.page as number,
      limit: data.limit as number,
      total: data.total as number,
      ticketProductList: TicketProduct.fromList(data.ticketProductList),
    }
  }

  static async list(query: TicketProductListQuery) {
    const params = TicketProductGetQuery.toQuery(query)

    const response = await AxiosInstance.get('/ticket-product/list', { params })
    const { data } = response.data as BaseResponse<{ ticketProductList: any[] }>
    return TicketProduct.fromList(data.ticketProductList)
  }
}
