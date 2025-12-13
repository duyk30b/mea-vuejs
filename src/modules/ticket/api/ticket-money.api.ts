import { AxiosInstance } from '@/core/axios.instance'
import { Customer } from '@/modules/customer'
import type { DiscountType } from '@/modules/enum'
import { Payment, PaymentActionType } from '@/modules/payment'
import type { TicketItemType } from '@/modules/payment-ticket-item'
import type { BaseResponse } from '../../_base/base-dto'
import { Ticket } from '../ticket.model'

export type TicketPaymentItemBody = {
  ticketItemType: TicketItemType
  ticketItemId: string
  interactId: number
  expectedPrice: number
  discountMoney: number
  discountPercent: number
  discountType: DiscountType
  actualPrice: number
  quantity: number
  sessionIndex: number
  paidAdd: number
  debtAdd: number
}

class TicketPaymentItemMapBody {
  ticketRegimenBodyList: TicketPaymentItemBody[]
  ticketProcedureNoEffectBodyList: TicketPaymentItemBody[]
  ticketProcedureHasEffectBodyList: TicketPaymentItemBody[]
  ticketProductConsumableBodyList: TicketPaymentItemBody[]
  ticketProductPrescriptionBodyList: TicketPaymentItemBody[]
  ticketLaboratoryBodyList: TicketPaymentItemBody[]
  ticketRadiologyBodyList: TicketPaymentItemBody[]
}

export class TicketMoneyApi {
  static async paymentMoney(object: {
    ticketId: string
    body: {
      walletId: string
      paymentActionType: PaymentActionType
      paidAdd: number
      paidItemAdd: number
      debtAdd: number
      debtItemAdd: number
      note: string
      ticketPaymentItemMapBody?: TicketPaymentItemMapBody
    }
  }) {
    const { ticketId, body } = object
    const response = await AxiosInstance.post(`/ticket/${ticketId}/payment-money`, body)
    const { data } = response.data as BaseResponse<{
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
    dataList: { ticketId: string; debtMinus: number; debtItemMinus: number }[]
  }) {
    const response = await AxiosInstance.post('/ticket/pay-debt', body)
    const { data } = response.data as BaseResponse<{
      customerModified: any
      ticketModifiedList: any[]
    }>

    const customerModified = Customer.from(data.customerModified)
    const ticketModifiedList = Ticket.fromList(data.ticketModifiedList)

    return { customerModified, ticketModifiedList }
  }
}
