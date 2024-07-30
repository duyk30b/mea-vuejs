import { AxiosInstance } from '../../core/axios.instance'
import type { ConditionEnum } from '../_base/base-condition'
import type { BaseResponse } from '../_base/base-dto'
import { Customer } from '../customer'
import { Procedure } from '../procedure'
import { Product } from '../product'
import { TicketGetQuery, type TicketFilterQuery, type TicketType } from '../ticket'

export class StatisticService {
  static async sumWarehouse() {
    const response = await AxiosInstance.get('/statistic/sum-warehouse')
    const { data } = response.data as BaseResponse
    return {
      totalCostAmount: data.totalCostAmount,
      totalRetailMoney: data.totalRetailMoney,
    }
  }

  static async topProductBestSelling(params: {
    fromTime: string
    toTime: string
    limit: number
    orderBy: 'sumActualMoney' | 'sumProfit' | 'sumQuantity'
  }) {
    const response = await AxiosInstance.get('/statistic/top-product-best-selling', { params })
    const { data } = response.data as BaseResponse<any[]>

    return data.map((i: any) => ({
      productId: i.productId as number,
      sumActualMoney: i.sumActualMoney as number,
      sumCostAmount: i.sumCostAmount as number,
      sumQuantity: i.sumQuantity as number,
      sumProfit: i.sumProfit as number,
      product: Product.from(i.product),
    }))
  }

  static async topProductHightMoney(params: {
    limit: number
    orderBy: 'quantity' | 'costAmount' | 'sumRetailMoney'
  }) {
    const response = await AxiosInstance.get('/statistic/top-product-high-money', {
      params,
    })
    const { data } = response.data as BaseResponse<any[]>

    data.forEach((i: Product & { sumRetailMoney: number }) => {
      i.quantity = Number(i.quantity)
      i.wholesalePrice = Number(i.wholesalePrice)
      i.retailPrice = Number(i.retailPrice)
      i.costPrice = Number(i.costPrice)
      i.costAmount = Number(i.costAmount)
      i.updatedAt = Number(i.updatedAt)
    })
    return data
  }

  static async topProcedureBestSelling(params: {
    fromTime: string
    toTime: string
    limit: number
    orderBy: 'sumActualMoney' | 'sumQuantity'
  }) {
    const response = await AxiosInstance.get('/statistic/top-procedure-best-selling', {
      params,
    })
    const { data } = response.data as BaseResponse<any[]>
    return data.map((i: any) => ({
      procedureId: i.procedureId as number,
      sumQuantity: i.sumQuantity as number,
      sumActualMoney: i.sumActualMoney as number,
      procedure: Procedure.from(i.procedure),
    }))
  }

  static async topCustomerBestTicket(params: {
    fromTime: string
    toTime: string
    limit: number
    orderBy: 'sumTotalMoney' | 'sumProfit' | 'countTicket'
  }) {
    const response = await AxiosInstance.get('/statistic/top-customer-best-ticket', { params })
    const { data } = response.data as BaseResponse<any[]>

    return data.map((i: any) => ({
      customerId: i.customerId as number,
      sumTotalCostAmount: i.sumTotalCostAmount as number,
      sumItemActual: i.sumItemActual as number,
      sumExpense: i.sumExpense as number,
      sumRevenue: i.sumRevenue as number,
      sumProfit: i.sumProfit as number,
      sumDebt: i.sumDebt as number,
      countTicket: i.countTicket as number,
      customer: Customer.from(i.customer),
    }))
  }

  static async sumCustomerDebt() {
    const response = await AxiosInstance.get('/statistic/sum-customer-debt')
    const { data } = response.data as BaseResponse<{ customerSumDebt: number }>
    return data.customerSumDebt as number
  }

  static async statisticReceipt(params: {
    fromTime: string
    toTime: string
    timeType: 'date' | 'month'
  }) {
    const response = await AxiosInstance.get('/statistic/statistic-receipt', { params })
    const { data } = response.data as BaseResponse<
      Record<
        string,
        {
          sumDiscountMoney: number
          sumTotalMoney: number
          sumDebt: number
          countReceipt: number
        }
      >
    >
    return Object.entries(data).map(([key, value]) => ({ timeLabel: key, ...value }))
  }

  static async statisticTicket(
    options: TicketFilterQuery & {
      fromTime: string
      toTime: string
      groupTimeType: 'date' | 'month'
    }
  ) {
    const filter = TicketGetQuery.toQuery(options)
    const response = await AxiosInstance.get('/statistic/statistic-ticket', {
      params: {
        ...filter,
        fromTime: options.fromTime,
        toTime: options.toTime,
        groupTimeType: options.groupTimeType,
      },
    })
    const { data } = response.data as BaseResponse<
      Record<
        string,
        {
          countTicket: number
          sumTotalMoney: number
          sumTotalCostAmount: number
          sumProcedureMoney: number
          sumProductMoney: number
          sumRadiologyMoney: number
          sumLaboratoryMoney: number
          sumSurcharge: number
          sumExpense: number
          sumDiscountMoney: number
          sumProfit: number
          sumDebt: number
        }
      >
    >
    return Object.entries(data).map(([key, value]) => ({ timeLabel: key, ...value }))
  }
}
