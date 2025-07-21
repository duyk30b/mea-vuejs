import type { DiscountType } from '@/modules/enum'
import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import { Ticket } from '../ticket.model'
import { TicketProduct } from '@/modules/ticket-product'
import { Customer } from '@/modules/customer'
import { PaymentItem } from '@/modules/payment-item'

export type TicketItemChangeMoney = {
  id: number
  quantity: number
  discountPercent: number
  discountMoney: number
  discountType: DiscountType
  actualPrice: number
}

export class TicketActionApi {
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

  static async changeAllMoney(
    ticketId: number,
    body: {
      ticketProcedureList: TicketItemChangeMoney[]
      ticketProductList: TicketItemChangeMoney[]
      ticketLaboratoryList: TicketItemChangeMoney[]
      ticketRadiologyList: TicketItemChangeMoney[]
    },
  ) {
    const response = await AxiosInstance.post(`/ticket/change-all-money/${ticketId}`, body)
    const { data } = response.data as BaseResponse<{ ticket: any }>
    return Ticket.from(data.ticket)
  }

  static async sendProduct(body: { ticketId: number; ticketProductIdList: number[] }) {
    const { ticketId, ticketProductIdList } = body
    const response = await AxiosInstance.post(`/ticket/send-product/${ticketId}`, {
      ticketProductIdList,
    })
    const { data } = response.data as BaseResponse<{
      ticketModified: any
      ticketProductModifiedAll?: any[]
    }>
    return {
      ticketModified: Ticket.from(data.ticketModified),
      ticketProductModifiedAll: data.ticketProductModifiedAll
        ? TicketProduct.fromList(data.ticketProductModifiedAll)
        : undefined,
    }
  }

  static async returnProduct(body: {
    ticketId: number
    returnList: {
      ticketBatchId: number
      quantityReturn: number
    }[]
  }) {
    const { ticketId, returnList } = body
    const response = await AxiosInstance.post(`/ticket/return-product/${ticketId}`, {
      returnList,
    })
    const { data } = response.data as BaseResponse
    return data
  }

  static async close(options: { ticketId: number }) {
    const { ticketId } = options
    const response = await AxiosInstance.post(`/ticket/close/${ticketId}`)
    const { data } = response.data as BaseResponse<{
      ticketModified: any
      customerModified?: any
      paymentItemCreatedList: any[]
    }>
    return {
      ticketModified: Ticket.from(data.ticketModified),
      customerModified: data.customerModified ? Customer.from(data.customerModified) : undefined,
      paymentItemCreatedList: PaymentItem.fromList(data.paymentItemCreatedList),
    }
  }

  static async reopen(options: { ticketId: number }) {
    const { ticketId } = options
    const response = await AxiosInstance.post(`/ticket/reopen/${ticketId}`)
    const { data } = response.data as BaseResponse<{
      ticketModified: any
      customerModified: any
      paymentItemCreatedList: any[]
    }>
    return {
      ticketModified: Ticket.from(data.ticketModified),
      customerModified: data.customerModified ? Customer.from(data.customerModified) : undefined,
      paymentItemCreatedList: PaymentItem.fromList(data.paymentItemCreatedList),
    }
  }

  static async terminate(options: { ticketId: number }) {
    const { ticketId } = options
    const response = await AxiosInstance.post(`/ticket/terminate/${ticketId}`)
    const { data } = response.data as BaseResponse<{
      ticketModified: any
      customerModified?: any
      paymentItemCreatedList: any[]
      ticketProductModifiedAll?: any[]
    }>
    return {
      ticketModified: Ticket.from(data.ticketModified),
      customerModified: data.customerModified ? Customer.from(data.customerModified) : undefined,
      paymentItemCreatedList: PaymentItem.fromList(data.paymentItemCreatedList),
      ticketProductModifiedAll: data.ticketProductModifiedAll
        ? TicketProduct.fromList(data.ticketProductModifiedAll)
        : undefined,
    }
  }

  static async destroy(ticketId: number) {
    const response = await AxiosInstance.delete(`/ticket/destroy/${ticketId}`)
    const { data } = response.data as BaseResponse<{ ticketId: any }>
    return data
  }
}
