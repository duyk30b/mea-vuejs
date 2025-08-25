import { AxiosInstance } from '@/core/axios.instance'
import { OmitClass } from '@/utils'
import type { BaseResponse } from '../_base/base-dto'
import { Product } from '../product'
import { TicketProductGetQuery } from '../ticket-product'

export type StatisticTicketProductResponseType = {
  count: number
  productId: number
  product: Product
  sumQuantity: number
  sumCostAmount: number
  sumActualAmount: number
  sumProfitAmount: number
}

export class StatisticTicketProductQuery extends OmitClass(TicketProductGetQuery, ['sort']) {
  sortStatistic?: { [P in keyof StatisticTicketProductResponseType]?: 'DESC' }

  static toQueryString(instance: Partial<StatisticTicketProductQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sortStatistic: instance.sortStatistic ? JSON.stringify(instance.sortStatistic) : undefined,
    }
  }
}

export class StatisticProductApi {
  static async sumWarehouse() {
    const response = await AxiosInstance.get('/statistic/product/sum-warehouse')
    const { data } = response.data as BaseResponse<
      {
        warehouseId: number
        sumCostAmount: number
        sumRetailAmount: number
      }[]
    >
    return data
  }

  static async topProductHightMoney(params: {
    limit: number
    orderBy: 'quantity' | 'costAmount' | 'retailAmount'
  }) {
    const response = await AxiosInstance.get('/statistic/product/top-product-high-money', {
      params,
    })
    const { data } = response.data as BaseResponse<any[]>

    data.forEach((i: Product & { retailAmount: number; costAmount: number }) => {
      i.quantity = Number(i.quantity)
      i.wholesalePrice = Number(i.wholesalePrice)
      i.retailPrice = Number(i.retailPrice)
      i.costPrice = Number(i.costPrice)
      i.updatedAt = Number(i.updatedAt)
      i.costAmount = Number(i.costAmount)
      i.retailAmount = Number(i.retailAmount)
    })
    return data
  }

  static async statisticTicketProduct(options: StatisticTicketProductQuery) {
    const params = StatisticTicketProductQuery.toQueryString(options)

    const response = await AxiosInstance.get('/statistic/product/statistic-ticket-product', {
      params,
    })
    const { data } = response.data as BaseResponse<{ dataStatistic: any[]; total: number }>
    return {
      dataStatistic: data.dataStatistic.map((i) => {
        const item: StatisticTicketProductResponseType = {
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
