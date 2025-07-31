import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Customer } from '../customer'
import { Distributor } from '../distributor'
import type { DiscountType } from '../enum'
import type { TicketItemType } from '../payment-ticket-item'
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

  static async customerPrepaymentMoney(options: {
    body: {
      ticketId: number
      customerId: number
      paymentMethodId: number
      paidAmount: number
      note: string
    }
    params?: PaymentResponseParams
  }) {
    const params = PaymentResponseParams.toQuery(options.params || {})

    const response = await AxiosInstance.post('/payment/customer-prepayment-money', options.body, {
      params,
    })
    const { data } = response.data as BaseResponse<{
      customer: any
      paymentCreated: any
      ticketModified: any
    }>

    const customer = Customer.from(data.customer)
    const ticketModified = Ticket.from(data.ticketModified)
    const paymentCreated = Payment.from(data.paymentCreated)

    return { customer, ticketModified, paymentCreated }
  }

  static async customerPayDebt(options: {
    body: {
      customerId: number
      paymentMethodId: number
      paidAmount: number
      note: string
      dataList: { ticketId: number; paidAmount: number }[]
    }
    params?: PaymentResponseParams
  }) {
    const params = PaymentResponseParams.toQuery(options.params || {})

    const response = await AxiosInstance.post('/payment/customer-pay-debt', options.body, {
      params,
    })
    const { data } = response.data as BaseResponse<{
      customerModified: any
      paymentCreatedList: any[]
      ticketModifiedList: any[]
    }>

    const customerModified = Customer.from(data.customerModified)
    const ticketModifiedList = Ticket.fromList(data.ticketModifiedList)
    const paymentCreatedList = Payment.fromList(data.paymentCreatedList)

    return { customerModified, ticketModifiedList, paymentCreatedList }
  }

  static async customerRefundMoney(options: {
    body: {
      ticketId: number
      customerId: number
      paymentMethodId: number
      refundAmount: number
      note: string
    }
    params?: PaymentResponseParams
  }) {
    const params = PaymentResponseParams.toQuery(options.params || {})

    const response = await AxiosInstance.post('/payment/customer-refund-money', options.body, {
      params,
    })
    const { data } = response.data as BaseResponse<{
      customer: any
      paymentCreated: any
      ticketModified: any
    }>

    const customer = Customer.from(data.customer)
    const ticketModified = Ticket.from(data.ticketModified)
    const paymentCreated = Payment.from(data.paymentCreated)

    return { customer, ticketModified, paymentCreated }
  }

  static async distributorPrepaymentMoney(options: {
    body: {
      receiptId: number
      distributorId: number
      paymentMethodId: number
      paidAmount: number
      note: string
    }
    params?: PaymentResponseParams
  }) {
    const params = PaymentResponseParams.toQuery(options.params || {})

    const response = await AxiosInstance.post(
      '/payment/distributor-prepayment-money',
      options.body,
      {
        params,
      },
    )
    const { data } = response.data as BaseResponse<{
      distributor: any
      paymentCreated: any
      receiptModified: any
    }>

    const distributor = Distributor.from(data.distributor)
    const receiptModified = Receipt.from(data.receiptModified)
    const paymentCreated = Payment.from(data.paymentCreated)

    return { distributor, receiptModified, paymentCreated }
  }

  static async distributorPayDebt(options: {
    body: {
      distributorId: number
      paymentMethodId: number
      paidAmount: number
      note: string
      dataList: { receiptId: number; paidAmount: number }[]
    }
    params?: PaymentResponseParams
  }) {
    const params = PaymentResponseParams.toQuery(options.params || {})

    const response = await AxiosInstance.post('/payment/distributor-pay-debt', options.body, {
      params,
    })
    const { data } = response.data as BaseResponse<{
      distributorModified: any
      paymentCreatedList: any[]
      receiptModifiedList: any[]
    }>

    const distributorModified = Distributor.from(data.distributorModified)
    const receiptModifiedList = Receipt.fromList(data.receiptModifiedList)
    const paymentCreatedList = Payment.fromList(data.paymentCreatedList)

    return { distributorModified, receiptModifiedList, paymentCreatedList }
  }

  static async distributorRefundMoney(options: {
    body: {
      receiptId: number
      distributorId: number
      paymentMethodId: number
      refundAmount: number
      note: string
    }
    params?: PaymentResponseParams
  }) {
    const params = PaymentResponseParams.toQuery(options.params || {})

    const response = await AxiosInstance.post('/payment/distributor-refund-money', options.body, {
      params,
    })
    const { data } = response.data as BaseResponse<{
      distributor: any
      paymentCreated: any
      receiptModified: any
    }>

    const distributor = Distributor.from(data.distributor)
    const receiptModified = Receipt.from(data.receiptModified)
    const paymentCreated = Payment.from(data.paymentCreated)

    return { distributor, receiptModified, paymentCreated }
  }

  static async customerPrepaymentTicketItemList(options: {
    body: {
      ticketId: number
      customerId: number
      paymentMethodId: number
      paidAmount: number
      note: string
      ticketItemList: {
        ticketItemType: TicketItemType
        ticketItemId: number
        interactId: number
        expectedPrice: number
        discountMoney: number
        discountPercent: number
        discountType: DiscountType
        actualPrice: number
        quantity: number
      }[]
    }
    params?: PaymentResponseParams
  }) {
    const params = PaymentResponseParams.toQuery(options.params || {})

    const response = await AxiosInstance.post(
      '/payment/customer-prepayment-ticket-item-list',
      options.body,
      { params },
    )
    const { data } = response.data as BaseResponse<{
      ticketModified: any
      customer: any
      paymentCreated: any
    }>

    const customer = Customer.from(data.customer)
    const ticketModified = Ticket.from(data.ticketModified)
    const paymentCreated = Payment.from(data.paymentCreated)

    return { customer, ticketModified, paymentCreated }
  }

  static async customerRefundTicketItemList(options: {
    body: {
      ticketId: number
      customerId: number
      paymentMethodId: number
      refundAmount: number
      note: string
      ticketItemList: {
        ticketItemId: number
        ticketItemType: TicketItemType
        interactId: number
        expectedPrice: number
        discountMoney: number
        discountPercent: number
        discountType: DiscountType
        actualPrice: number
        quantity: number
      }[]
    }
    params?: PaymentResponseParams
  }) {
    const params = PaymentResponseParams.toQuery(options.params || {})

    const response = await AxiosInstance.post(
      '/payment/customer-refund-ticket-item-list',
      options.body,
      { params },
    )
    const { data } = response.data as BaseResponse<{
      ticketModified: any
      customer: any
      paymentCreated: any
    }>

    const customer = Customer.from(data.customer)
    const ticketModified = Ticket.from(data.ticketModified)
    const paymentCreated = Payment.from(data.paymentCreated)

    return { customer, ticketModified, paymentCreated }
  }

  static async otherPaymentIn(body: { paymentMethodId: number; paidAmount: number; note: string }) {
    const response = await AxiosInstance.post('/payment/other-money-in', body)
    const { data } = response.data as BaseResponse<{ payment: any }>

    return Payment.from(data.payment)
  }

  static async otherPaymentOut(body: {
    paymentMethodId: number
    paidAmount: number
    note: string
  }) {
    const response = await AxiosInstance.post('/payment/other-money-out', body)
    const { data } = response.data as BaseResponse<{ payment: any }>

    return Payment.from(data.payment)
  }
}
