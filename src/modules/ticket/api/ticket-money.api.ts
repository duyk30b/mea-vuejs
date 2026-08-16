import { AxiosInstance } from '@/core/axios.instance'
import { Customer } from '@/modules/customer'
import { PaymentActionType } from '@/modules/payment/payment.type'
import type { PaymentTicket } from '@/modules/payment_ticket'
import type { FullResponse } from '../../_base/base-dto'
import { Ticket } from '../ticket.model'
import type { TicketActionType } from '../ticket.type'
import { Payment } from '@/modules/payment/payment.model'

export type PaymentTicketItemBody = Pick<
  PaymentTicket,
  | 'paymentTicketItemType'
  | 'ticketItemId'
  | 'ticketItemInteractId'
  | 'expectedPrice'
  | 'discountType'
  | 'discountMoney'
  | 'discountPercent'
  | 'actualPrice'
  | 'quantity'
  | 'unitRate'
  | 'sessionIndex'
  | 'paidMoney'
>

class PaymentTicketItemMapBody {
  paymentWait: { paidMoney: number }
  paymentSurcharge: { paidMoney: number }
  paymentDiscount: { paidMoney: number }
  paymentTicketRegimenList: PaymentTicketItemBody[]
  paymentTicketProcedureNoEffectList: PaymentTicketItemBody[]
  paymentTicketProcedureHasEffectList: PaymentTicketItemBody[]
  paymentTicketProductConsumableList: PaymentTicketItemBody[]
  paymentTicketProductPrescriptionList: PaymentTicketItemBody[]
  paymentTicketLaboratoryList: PaymentTicketItemBody[]
  paymentTicketRadiologyList: PaymentTicketItemBody[]
}

export class TicketMoneyApi {
  static async paymentMoney(object: {
    ticketId: string
    body: {
      paymentActionType: PaymentActionType
      ticketActionType: TicketActionType
      walletId: string
      isPaymentEachItem: 0 | 1
      paidTotal: number
      note: string
      paymentTicketItemMap?: PaymentTicketItemMapBody
    }
  }) {
    const { ticketId, body } = object
    const response = await AxiosInstance.post(`/ticket/${ticketId}/payment-money`, body)
    const { data } = response.data as FullResponse<{
      ticketModified: any
      paymentCreated: any
    }>

    return {
      paymentCreated: Payment.from(data.paymentCreated),
    }
  }

  static async changeDebt(body: {
    customerId: number
    paymentActionType: PaymentActionType
    walletId: string
    note: string
    changeDebtListBody: {
      ticketActionType: TicketActionType
      ticketId: string
      paid: number
      debt: number
    }[]
  }) {
    const response = await AxiosInstance.post('/ticket/change-debt', body)
    const { data } = response.data as FullResponse<{
      ticketModifiedList: any[]
      customerModified: any
    }>

    return {
      ticketModifiedList: Ticket.fromList(data.ticketModifiedList),
      customerModified: Customer.from(data.customerModified),
    }
  }
}
