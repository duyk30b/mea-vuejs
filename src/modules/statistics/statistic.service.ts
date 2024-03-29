import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Customer } from '../customer'
import { Product } from '../product'

export class StatisticService {
  static async sumWarehouse() {
    const response = await AxiosInstance.get('/statistic/sum-warehouse')
    const { data } = response.data as BaseResponse
    return {
      totalCostMoney: data.totalCostMoney,
      totalRetailMoney: data.totalRetailMoney,
    }
  }

  static async topProductHighCostMoney(params: { limit: number }) {
    const response = await AxiosInstance.get('/statistic/top-product-high-cost-money', { params })
    const { data } = response.data as BaseResponse<any[]>

    return data.map((i: any) => ({
      sumCostMoney: i.sumCostMoney,
      sumRetailMoney: i.sumRetailMoney,
      sumQuantity: i.sumQuantity,
      product: Product.fromPlain(i.product),
    }))
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
      sumCostMoney: i.sumCostMoney as number,
      sumQuantity: i.sumQuantity as number,
      sumProfit: i.sumProfit as number,
      product: Product.fromPlain(i.product),
    }))
  }

  static async topProcedureBestSelling(params: {
    fromTime: string
    toTime: string
    limit: number
    orderBy: 'sumActualMoney' | 'sumProfit' | 'sumQuantity'
  }) {
    const response = await AxiosInstance.get('/statistic/top-procedure-best-selling', { params })
    const { data } = response.data as BaseResponse<
      {
        procedureId: number
        procedureName: string
        sumQuantity: number
        sumCostMoney: number
        sumActualMoney: number
        sumProfit: number
      }[]
    >
    return data
  }

  static async topCustomerBestInvoice(params: {
    fromTime: string
    toTime: string
    limit: number
    orderBy: 'sumRevenue' | 'sumProfit' | 'countInvoice'
  }) {
    const response = await AxiosInstance.get('/statistic/top-customer-best-invoice', { params })
    const { data } = response.data as BaseResponse<any[]>

    return data.map((i: any) => ({
      customerId: i.customerId as number,
      sumItemCost: i.sumItemCost as number,
      sumItemActual: i.sumItemActual as number,
      sumExpense: i.sumExpense as number,
      sumRevenue: i.sumRevenue as number,
      sumProfit: i.sumProfit as number,
      sumDebt: i.sumDebt as number,
      countInvoice: i.countInvoice as number,
      customer: Customer.fromPlain(i.customer),
    }))
  }

  static async sumCustomerDebt() {
    const response = await AxiosInstance.get('/statistic/sum-customer-debt')
    const { data } = response.data as BaseResponse<{ customerSumDebt: number }>
    return data.customerSumDebt as number
  }

  static async sumMoneyInvoice(params: {
    fromTime: string
    toTime: string
    timeType: 'date' | 'month'
  }) {
    const response = await AxiosInstance.get('/statistic/sum-money-invoice', { params })
    const { data } = response.data as BaseResponse<
      Record<
        string,
        {
          oid: number
          shipYear: number
          shipMonth: number
          shipDate: number
          sumItemsCost: number
          sumItemsActual: number
          sumItemsProfit: number
          sumSurcharge: number
          sumDiscountMoney: number
          sumExpense: number
          sumRevenue: number
          sumProfit: number
          sumDebt: number
          countInvoice: number
        }
      >
    >
    return Object.entries(data).map(([key, value]) => ({ time: key, ...value }))
  }

  static async sumMoneyReceipt(params: {
    fromTime: string
    toTime: string
    timeType: 'date' | 'month'
  }) {
    const response = await AxiosInstance.get('/statistic/sum-money-receipt', { params })
    const { data } = response.data as BaseResponse<
      Record<
        string,
        {
          oid: number
          shipYear: number
          shipMonth: number
          shipDate: number
          sumRevenue: number
          countReceipt: number
        }
      >
    >
    return Object.entries(data).map(([key, value]) => ({ time: key, ...value }))
  }

  static async sumInvoiceSurchargeAndExpense(params: {
    fromTime: string
    toTime: string
    timeType: 'date' | 'month'
  }) {
    const response = await AxiosInstance.get('/statistic/sum-invoice-surcharge-and-expense', {
      params,
    })
    const { data } = response.data as BaseResponse<{
      surcharge: Record<string, { name: string; data: Record<string, { sumMoney: number }> }>
      expense: Record<string, { name: string; data: Record<string, { sumMoney: number }> }>
    }>
    return data
  }

  // static async revenueMonth(params: { month: number; year: number }) {
  //   const response = await AxiosInstance.get('/statistic/revenue-month', { params })
  //   const { data } = response.data as BaseResponse<{
  //     data: [
  //       {
  //         date?: number
  //         from?: number
  //         to: number
  //         revenue: number
  //         profit: number
  //       },
  //     ]
  //     month?: number
  //     year?: number
  //   }>
  //   return data
  // }
}
