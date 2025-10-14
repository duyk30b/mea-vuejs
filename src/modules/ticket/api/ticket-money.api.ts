import { AxiosInstance } from '@/core/axios.instance'
import { Customer } from '@/modules/customer'
import type { DiscountType, PaymentMoneyStatus } from '@/modules/enum'
import { Payment, PaymentResponseParams } from '@/modules/payment'
import type { TicketItemType } from '@/modules/payment-ticket-item'
import type { BaseResponse } from '../../_base/base-dto'
import { Ticket } from '../ticket.model'

export type TicketItemPaymentBody = {
  ticketItemType: TicketItemType
  ticketItemId: string
  interactId: number
  expectedPrice: number
  discountMoney: number
  discountPercent: number
  discountType: DiscountType
  actualPrice: number
  quantity: number
  paymentMoneyStatus: PaymentMoneyStatus
}

export class TicketMoneyApi {
  static async prepaymentMoney(object: {
    ticketId: string
    body: {
      customerId: number
      paymentMethodId: number
      paidAmount: number
      note: string
    }
  }) {
    const { ticketId, body } = object
    const response = await AxiosInstance.post(`/ticket/${ticketId}/prepayment-money`, body)
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

  static async payDebt(body: {
    customerId: number
    paymentMethodId: number
    paidAmount: number
    note: string
    dataList: { ticketId: string; paidAmount: number }[]
  }) {
    const response = await AxiosInstance.post('/ticket/pay-debt', body)
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

  static async refundMoney(object: {
    ticketId: string
    body: {
      customerId: number
      paymentMethodId: number
      refundAmount: number
      note: string
    }
    params?: PaymentResponseParams
  }) {
    const paramsString = PaymentResponseParams.toQuery(object.params || {})
    const { ticketId, body, params } = object

    const response = await AxiosInstance.post(`/ticket/${ticketId}/refund-money`, body)
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

  static async prepaymentTicketItemList(props: {
    ticketId: string
    body: {
      customerId: number
      paymentMethodId: number
      paidAmount: number
      note: string
      ticketRegimenBodyList: TicketItemPaymentBody[]
      ticketProcedureBodyList: TicketItemPaymentBody[]
      ticketProductConsumableBodyList: TicketItemPaymentBody[]
      ticketProductPrescriptionBodyList: TicketItemPaymentBody[]
      ticketLaboratoryBodyList: TicketItemPaymentBody[]
      ticketRadiologyBodyList: TicketItemPaymentBody[]
    }
  }) {
    const { ticketId, body } = props
    const response = await AxiosInstance.post(
      `/ticket/${ticketId}/prepayment-ticket-item-list`,
      body,
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

  static async refundTicketItemList(object: {
    ticketId: string
    body: {
      customerId: number
      paymentMethodId: number
      refundAmount: number
      note: string
      ticketRegimenBodyList: TicketItemPaymentBody[]
      ticketProcedureBodyList: TicketItemPaymentBody[]
      ticketProductConsumableBodyList: TicketItemPaymentBody[]
      ticketProductPrescriptionBodyList: TicketItemPaymentBody[]
      ticketLaboratoryBodyList: TicketItemPaymentBody[]
      ticketRadiologyBodyList: TicketItemPaymentBody[]
    }
    params?: PaymentResponseParams
  }) {
    const { ticketId, body, params } = object
    const paramsString = PaymentResponseParams.toQuery(params || {})

    const response = await AxiosInstance.post(`/ticket/${ticketId}/refund-ticket-item-list`, body)
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
}
