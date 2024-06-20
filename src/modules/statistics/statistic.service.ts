import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Customer } from '../customer'
import { Procedure } from '../procedure'
import { Product } from '../product'

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
      product: Product.fromPlain(i.product),
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
      i.deletedAt = i.deletedAt === null ? null : Number(i.deletedAt)
    })
    return data
  }

  static async topInvoiceProcedureBestSelling(params: {
    fromTime: string
    toTime: string
    limit: number
    orderBy: 'sumActualMoney' | 'sumQuantity'
  }) {
    const response = await AxiosInstance.get('/statistic/top-invoice-procedure-best-selling', {
      params,
    })
    const { data } = response.data as BaseResponse<any[]>
    return data.map((i: any) => ({
      procedureId: i.procedureId as number,
      sumQuantity: i.sumQuantity as number,
      sumActualMoney: i.sumActualMoney as number,
      procedure: Procedure.fromPlain(i.procedure),
    }))
  }

  static async topVisitProcedureBestSelling(params: {
    fromTime: string
    toTime: string
    limit: number
    orderBy: 'sumActualMoney' | 'sumQuantity'
  }) {
    const response = await AxiosInstance.get('/statistic/top-visit-procedure-best-selling', {
      params,
    })
    const { data } = response.data as BaseResponse<any[]>
    return data.map((i: any) => ({
      procedureId: i.procedureId as number,
      sumQuantity: i.sumQuantity as number,
      sumActualMoney: i.sumActualMoney as number,
      procedure: Procedure.fromPlain(i.procedure),
    }))
  }

  static async topCustomerBestInvoice(params: {
    fromTime: string
    toTime: string
    limit: number
    orderBy: 'sumTotalMoney' | 'sumProfit' | 'countInvoice'
  }) {
    const response = await AxiosInstance.get('/statistic/top-customer-best-invoice', { params })
    const { data } = response.data as BaseResponse<any[]>

    return data.map((i: any) => ({
      customerId: i.customerId as number,
      sumTotalCostAmount: i.sumTotalCostAmount as number,
      sumItemActual: i.sumItemActual as number,
      sumExpense: i.sumExpense as number,
      sumRevenue: i.sumRevenue as number,
      sumProfit: i.sumProfit as number,
      sumDebt: i.sumDebt as number,
      countInvoice: i.countInvoice as number,
      customer: Customer.fromPlain(i.customer),
    }))
  }

  static async topCustomerBestVisit(params: {
    fromTime: string
    toTime: string
    limit: number
    orderBy: 'sumTotalMoney' | 'sumProfit' | 'countVisit'
  }) {
    const response = await AxiosInstance.get('/statistic/top-customer-best-visit', { params })
    const { data } = response.data as BaseResponse<any[]>

    return data.map((i: any) => ({
      customerId: i.customerId as number,
      sumTotalCostAmount: i.sumTotalCostAmount as number,
      sumTotalMoney: i.sumTotalMoney as number,
      sumProfit: i.sumProfit as number,
      sumDebt: i.sumDebt as number,
      countVisit: i.countVisit as number,
      customer: Customer.fromPlain(i.customer),
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

  static async statisticInvoice(params: {
    fromTime: string
    toTime: string
    timeType: 'date' | 'month'
  }) {
    const response = await AxiosInstance.get('/statistic/statistic-invoice', { params })
    const { data } = response.data as BaseResponse<
      Record<
        string,
        {
          sumTotalCostAmount: number
          sumItemsActual: number
          sumSurcharge: number
          sumExpense: number
          sumDiscountMoney: number
          sumTotalMoney: number
          sumProfit: number
          sumDebt: number
          countInvoice: number
        }
      >
    >
    return Object.entries(data).map(([key, value]) => ({ timeLabel: key, ...value }))
  }

  static async statisticVisit(params: {
    fromTime: string
    toTime: string
    timeType: 'date' | 'month'
  }) {
    const response = await AxiosInstance.get('/statistic/statistic-visit', { params })
    const { data } = response.data as BaseResponse<
      Record<
        string,
        {
          sumDebt: number
          sumDiscountMoney: number
          sumProceduresMoney: number
          sumProductsMoney: number
          sumProfit: number
          sumTotalCostAmount: number
          sumTotalMoney: number
          countVisit: number
        }
      >
    >
    return Object.entries(data).map(([key, value]) => ({ timeLabel: key, ...value }))
  }
}
