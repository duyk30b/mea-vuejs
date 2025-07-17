import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import type { DiscountType } from '../../enum'
import { Payment } from '../../payment/payment.model'
import { Ticket } from '../ticket.model'

export class TicketMoneyApi {
  static async prepayment(body: {
    ticketId: number
    money: number
    note: string
    paymentMethodId: number
  }) {
    const { ticketId } = body
    const response = await AxiosInstance.post(`/ticket/prepayment/${ticketId}`, {
      money: body.money,
      note: body.note,
      paymentMethodId: body.paymentMethodId,
    })
    const { data } = response.data as BaseResponse<{ ticket: any; payment: any }>
    return {
      ticket: Ticket.from(data.ticket),
      payment: Payment.from(data.payment),
    }
  }

  static async refundOverpaid(body: {
    ticketId: number
    money: number
    note: string
    paymentMethodId: number
  }) {
    const { ticketId } = body
    const response = await AxiosInstance.post(`/ticket/refund-overpaid/${ticketId}`, {
      money: body.money,
      note: body.note,
      paymentMethodId: body.paymentMethodId,
    })
    const { data } = response.data as BaseResponse
  }

  static async payDebt(body: {
    ticketId: number
    money: number
    note: string
    paymentMethodId: number
  }) {
    const { ticketId } = body
    const response = await AxiosInstance.post(`/ticket/pay-debt/${ticketId}`, {
      money: body.money,
      note: body.note,
      paymentMethodId: body.paymentMethodId,
    })
    const { data } = response.data as BaseResponse
  }

  static async changeDiscount(
    ticketId: number,
    body: {
      discountType: DiscountType
      discountMoney: number
      discountPercent: number
    },
  ) {
    const response = await AxiosInstance.post(`/ticket/change-discount/${ticketId}`, {
      discountType: body.discountType,
      discountMoney: body.discountMoney,
      discountPercent: body.discountPercent,
    })
    const { data } = response.data as BaseResponse
  }
}
