import { AxiosInstance } from '@/core/axios.instance'
import { Customer } from '@/modules/customer'
import { Payment, PaymentActionType } from '@/modules/payment'
import type { PaymentTicketItem } from '@/modules/payment-ticket-item'
import type { FullResponse } from '../../_base/base-dto'
import { Ticket } from '../ticket.model'

export type PaymentTicketItemBody = Pick<
  PaymentTicketItem,
  | 'ticketItemType'
  | 'ticketItemId'
  | 'interactId'
  | 'expectedPrice'
  | 'discountMoney'
  | 'discountPercent'
  | 'discountType'
  | 'actualPrice'
  | 'quantity'
  | 'unitRate'
  | 'sessionIndex'
  | 'paidMoney'
  | 'debtMoney'
>

class PaymentTicketItemMapBody {
  paymentWait: { paidMoney: number }
  paymentSurcharge: { paidMoney: number; debtMoney: number }
  paymentDiscount: { paidMoney: number; debtMoney: number }
  ticketRegimenBodyList: PaymentTicketItemBody[]
  ticketProcedureNoEffectBodyList: PaymentTicketItemBody[]
  ticketProcedureHasEffectBodyList: PaymentTicketItemBody[]
  ticketProductConsumableBodyList: PaymentTicketItemBody[]
  ticketProductPrescriptionBodyList: PaymentTicketItemBody[]
  ticketLaboratoryBodyList: PaymentTicketItemBody[]
  ticketRadiologyBodyList: PaymentTicketItemBody[]
}

export class TicketMoneyApi {
  static async paymentMoney(object: {
    ticketId: string
    body: {
      walletId: string
      paymentActionType: PaymentActionType
      hasPaymentItem: 0 | 1
      paidTotal: number
      debtTotal: number
      note: string
      paymentTicketItemMapDto?: PaymentTicketItemMapBody
    }
  }) {
    const { ticketId, body } = object
    const response = await AxiosInstance.post(`/ticket/${ticketId}/payment-money`, body)
    const { data } = response.data as FullResponse<{
      customerModified: any
      paymentCreated: any
      ticketModified: any
    }>

    const customerModified = Customer.from(data.customerModified)
    const ticketModified = Ticket.from(data.ticketModified)
    const paymentCreated = Payment.from(data.paymentCreated)

    return { customerModified, ticketModified, paymentCreated }
  }

  static async payDebt(body: {
    customerId: number
    walletId: string
    totalMoney: number
    note: string
    dataList: {
      ticketId: string
      isPaymentEachItem: number
      debtTotalMinus: number
    }[]
  }) {
    const response = await AxiosInstance.post('/ticket/pay-debt', body)
    const { data } = response.data as FullResponse<{
      customerModified: any
      ticketModifiedList: any[]
    }>

    const customerModified = Customer.from(data.customerModified)
    const ticketModifiedList = Ticket.fromList(data.ticketModifiedList)

    return { customerModified, ticketModifiedList }
  }
}
