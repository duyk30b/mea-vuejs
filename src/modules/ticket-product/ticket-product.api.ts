import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Product } from '../product'
import {
  TicketProductGetQuery,
  TicketProductListQuery,
  TicketProductStatisticQuery,
  type TicketProductPaginationQuery,
  type TicketProductStatisticResponseType,
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

  static async statisticProduct(options: TicketProductStatisticQuery) {
    const params = TicketProductGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/ticket-product/statistic-product', { params })
    const { data } = response.data as BaseResponse<{ dataStatistic: any[]; total: number }>
    return {
      dataStatistic: data.dataStatistic.map((i) => {
        const item: TicketProductStatisticResponseType = {
          count: i.count as number,
          productId: i.productId as number,
          product: Product.from(i.product),
          sumQuantity: i.sumQuantity as number,
          sumCostAmount: i.sumCostAmount as number,
          sumActualAmount: i.sumActualAmount as number,
          sumProfitAmount: i.sumProfitAmount as number,
        }
        return item
      }),
      total: data.total,
    }
  }
}
