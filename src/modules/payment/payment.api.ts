import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { PaymentGetParams, PaymentListQuery, PaymentPaginationQuery } from './payment.dto'
import { MoneyDirection, Payment } from './payment.model'

export class PaymentApi {
  static async pagination(options: PaymentPaginationQuery) {
    const params = PaymentGetParams.toQuery(options)

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
    const params = PaymentGetParams.toQuery(options)

    const response = await AxiosInstance.get('/payment/list', { params })
    const { data } = response.data as BaseResponse<{ paymentList: any[] }>
    return Payment.fromList(data.paymentList)
  }

  static async updateInfo(options: {
    paymentId: string
    body: { paymentMethodId: number; note: string }
  }) {
    const { paymentId, body } = options
    const response = await AxiosInstance.post(`/payment/update-info/${paymentId}`, body)
    const { data } = response.data as BaseResponse<{ payment: any }>
    return Payment.from(data.payment)
  }

  static async sumMoney(options: PaymentListQuery) {
    const params = PaymentGetParams.toQuery(options)

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

  static async otherCreateMoneyOut(body: {
    paymentMethodId: number
    paidAmount: number
    note: string
  }) {
    const response = await AxiosInstance.post('/payment/other/create-money-out', body)
    const { data } = response.data as BaseResponse<{ payment: any }>
    return Payment.from(data.payment)
  }

  static async otherCreateMoneyIn(body: {
    paymentMethodId: number
    paidAmount: number
    note: string
  }) {
    const response = await AxiosInstance.post('/payment/other/create-money-in', body)
    const { data } = response.data as BaseResponse<{ payment: any }>
    return Payment.from(data.payment)
  }

  static async otherDestroyMoneyOut(options: { paymentId: string }) {
    const { paymentId } = options
    const response = await AxiosInstance.post(`/payment/other/destroy-money-out/${paymentId}`)
    const { data } = response.data as BaseResponse<{ payment: any }>
  }

  static async otherDestroyMoneyIn(options: { paymentId: string }) {
    const { paymentId } = options
    const response = await AxiosInstance.post(`/payment/other/destroy-money-in/${paymentId}`)
    const { data } = response.data as BaseResponse<{ payment: any }>
  }
}
