import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { CustomerPayment } from '../customer-payment/customer-payment.model'
import { Ticket } from './ticket.model'

export class TicketOrderActionApi {
  static async prepayment(options: { ticketId: number; money: number }) {
    const { ticketId, money } = options
    const response = await AxiosInstance.post(`/ticket-order/${ticketId}/prepayment`, {
      money,
    })
    const { data } = response.data as BaseResponse<{ ticketBasic: any; customerPayment: any }>
    return {
      ticketBasic: Ticket.from(data.ticketBasic),
      customerPayment: CustomerPayment.from(data.customerPayment),
    }
  }

  static async sendProductAndPaymentAndClose(options: { ticketId: number; money: number }) {
    const { ticketId, money } = options
    const response = await AxiosInstance.post(
      `/ticket-order/${ticketId}/send-product-and-payment-and-close`,
      { money }
    )
    const { data } = response.data as BaseResponse<{ ticketBasic: any; customerPayment?: any }>
    return {
      ticketBasic: Ticket.from(data.ticketBasic),
      customerPayment: data.customerPayment ? CustomerPayment.from(data.customerPayment) : null,
    }
  }

  static async paymentAndClose(options: { ticketId: number; money: number }) {
    const { ticketId, money } = options
    const response = await AxiosInstance.post(`/ticket-order/${ticketId}/payment-and-close`, {
      money,
    })
    const { data } = response.data as BaseResponse<{ ticketBasic: any; customerPayment: any }>
    return {
      ticketBasic: Ticket.from(data.ticketBasic),
      customerPayment: data.customerPayment ? CustomerPayment.from(data.customerPayment) : null,
    }
  }

  static async refundOverpaid(options: { ticketId: number; money: number }) {
    const { ticketId, money } = options
    const response = await AxiosInstance.post(`/ticket-order/${ticketId}/refund-overpaid`, {
      money,
    })
    const { data } = response.data as BaseResponse<{ ticketBasic: any; customerPayment: any }>
    return {
      ticketBasic: Ticket.from(data.ticketBasic),
      customerPayment: CustomerPayment.from(data.customerPayment),
    }
  }

  static async sendProduct(options: { ticketId: number }) {
    const { ticketId } = options
    const response = await AxiosInstance.post(`/ticket-order/${ticketId}/send-product`)
    const { data } = response.data as BaseResponse<{ ticketBasic: any; customerPayment: any }>
    return {
      ticketBasic: Ticket.from(data.ticketBasic),
    }
  }

  static async returnProduct(options: {
    ticketId: number
    returnList: {
      ticketProductId: number
      quantityReturn: number
      actualPrice: number
      costAmountReturn: number
    }[]
    discountMoneyReturn: number
    surchargeReturn: number
    debtReturn: number
    paidReturn: number
  }) {
    const { ticketId, returnList } = options
    const response = await AxiosInstance.post(`/ticket-order/${ticketId}/return-product`, {
      returnList,
      discountMoneyReturn: options.discountMoneyReturn,
      surchargeReturn: options.surchargeReturn,
      debtReturn: options.debtReturn,
      paidReturn: options.paidReturn,
    })
    const { data } = response.data as BaseResponse<{ ticketBasic: any; customerPayment?: any }>
    return {
      ticketBasic: Ticket.from(data.ticketBasic),
      customerPayment: data.customerPayment ? CustomerPayment.from(data.customerPayment) : null,
    }
  }

  static async payDebt(options: { ticketId: number; money: number }) {
    const { ticketId, money } = options
    const response = await AxiosInstance.post(`/ticket-order/${ticketId}/pay-debt`, {
      money,
    })
    const { data } = response.data as BaseResponse<{ ticketBasic: any; customerPayment: any }>
    return {
      ticketBasic: Ticket.from(data.ticketBasic),
      customerPayment: CustomerPayment.from(data.customerPayment),
    }
  }

  static async cancel(options: { ticketId: number }) {
    const { ticketId } = options
    const response = await AxiosInstance.post(`/ticket-order/${ticketId}/cancel`)
    const { data } = response.data as BaseResponse<{ ticketBasic: any; customerPayment: any }>
    return {
      ticketBasic: Ticket.from(data.ticketBasic),
      customerPayment: data.customerPayment ? CustomerPayment.from(data.customerPayment) : null,
    }
  }
}
