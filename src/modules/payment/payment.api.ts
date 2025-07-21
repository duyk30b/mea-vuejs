import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Customer } from '../customer'
import { Distributor } from '../distributor'
import { PaymentItem, type PaymentVoucherItemType } from '../payment-item'
import { Receipt } from '../receipt'
import { Ticket } from '../ticket'
import {
  PaymentGetParams,
  PaymentListQuery,
  PaymentPaginationQuery,
  PaymentResponseParams,
} from './payment.dto'
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

  static async customerPayment(options: {
    body: {
      customerId: number
      paymentMethodId: number
      totalMoney: number
      reason: string
      note: string
      paymentItemData: {
        payDebt: { ticketId: number; amount: number }[]
        prepayment?: {
          ticketId: number
          itemList: {
            ticketItemId: number // nếu không chọn ticketItem thì là tạm ứng vào đơn
            voucherItemType: PaymentVoucherItemType
            amount: number
            paymentInteractId: number
          }[]
        }
        moneyTopUpAdd: number
      }
    }
    params?: PaymentResponseParams
  }) {
    const params = PaymentResponseParams.toQuery(options.params || {})

    const response = await AxiosInstance.post('/payment/customer-payment', options.body, { params })
    const { data } = response.data as BaseResponse<{
      customerModified: any
      paymentCreated: any
      ticketModifiedList: any[]
      paymentItemCreatedList: any[]
    }>

    const customerModified = Customer.from(data.customerModified)
    const ticketModifiedList = Ticket.fromList(data.ticketModifiedList)
    const paymentCreated = Payment.from(data.paymentCreated)
    const paymentItemCreatedList = PaymentItem.fromList(data.paymentItemCreatedList)
    paymentCreated.paymentItemList = paymentItemCreatedList

    return { customerModified, ticketModifiedList, paymentItemCreatedList, paymentCreated }
  }

  static async customerRefund(body: {
    customerId: number
    ticketId: number
    money: number
    paymentMethodId: number
    reason: string
  }) {
    const response = await AxiosInstance.post('/payment/customer-refund', body)
    const { data } = response.data as BaseResponse<{
      ticketModified: any
      customer: any
      paymentItemCreated: any
    }>

    const customer = Customer.from(data.customer)
    const ticketModified = Ticket.from(data.ticketModified)
    const paymentItemCreated = PaymentItem.from(data.paymentItemCreated)
    return { customer, ticketModified, paymentItemCreated }
  }

  static async distributorPayment(body: {
    distributorId: number
    paymentMethodId: number
    totalMoney: number
    reason: string
    note: string
    paymentItemData: {
      payDebt: { receiptId: number; amount: number }[]
      prepayment?: {
        receiptId: number
        itemList: {
          amount: number
          receiptItemId: number
          voucherItemType: PaymentVoucherItemType
        }[]
      }
      moneyTopUpAdd: number
    }
  }) {
    const response = await AxiosInstance.post('/payment/distributor-payment', body)
    const { data } = response.data as BaseResponse<{
      distributorModified: any
      receiptModifiedList: any[]
      paymentItemCreatedList: any[]
    }>

    const distributorModified = Distributor.from(data.distributorModified)
    const receiptModifiedList = Receipt.fromList(data.receiptModifiedList)
    const paymentItemCreatedList = PaymentItem.fromList(data.paymentItemCreatedList)
    return { distributorModified, receiptModifiedList, paymentItemCreatedList }
  }

  static async distributorRefund(body: {
    distributorId: number
    receiptId: number
    money: number
    paymentMethodId: number
    reason: string
  }) {
    const response = await AxiosInstance.post('/payment/distributor-refund', body)
    const { data } = response.data as BaseResponse<{
      distributor: any
      receiptModified: any
      paymentItemCreated: any
    }>

    const distributor = Customer.from(data.distributor)
    const receiptModified = Ticket.from(data.receiptModified)
    const paymentItemCreated = PaymentItem.from(data.paymentItemCreated)
    return { distributor, receiptModified, paymentItemCreated }
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
