import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Customer } from '../customer'
import { Distributor } from '../distributor'
import {
  PaymentGetQuery,
  PaymentListQuery,
  PaymentPaginationQuery,
  type CustomerPaymentBody,
  type DistributorPaymentBody,
} from './payment.dto'
import { MoneyDirection, Payment } from './payment.model'

export class PaymentApi {
  static async pagination(options: PaymentPaginationQuery) {
    const params = PaymentGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/payment/pagination', { params })
    const { data } = response.data as BaseResponse<{
      paymentList: any[]
      page: number
      limit: number
      total: number
    }>
    data.paymentList = Payment.fromList(data.paymentList)
    return data
  }

  static async list(options: PaymentListQuery) {
    const params = PaymentGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/payment/list', { params })
    const { data } = response.data as BaseResponse<{ paymentList: any[] }>
    return Payment.fromList(data.paymentList)
  }

  static async sumMoney(options: PaymentListQuery) {
    const params = PaymentGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/payment/sum-money', { params })
    const { data } = response.data as BaseResponse<{
      aggregate: {
        moneyDirection: MoneyDirection
        sumPaidAmount: number
        count: number
      }[]
    }>
    return data
  }

  static async customerPayment(body: CustomerPaymentBody) {
    const response = await AxiosInstance.post('/payment/customer-money-in', body)
    const { data } = response.data as BaseResponse<{ customer: any }>

    const customer = Customer.from(data.customer)

    return { customer }
  }

  static async distributorPayment(body: DistributorPaymentBody) {
    const response = await AxiosInstance.post('/payment/distributor-money-out', body)
    const { data } = response.data as BaseResponse<{ distributor: any }>

    const distributor = Distributor.from(data.distributor)

    return { distributor }
  }

  static async otherPaymentIn(body: { paymentMethodId: number; money: number; note: string }) {
    const response = await AxiosInstance.post('/payment/other-money-in', body)
    const { data } = response.data as BaseResponse<{ payment: any }>

    return Payment.from(data.payment)
  }

  static async otherPaymentOut(body: { paymentMethodId: number; money: number; note: string }) {
    const response = await AxiosInstance.post('/payment/other-money-out', body)
    const { data } = response.data as BaseResponse<{ payment: any }>

    return Payment.from(data.payment)
  }
}
