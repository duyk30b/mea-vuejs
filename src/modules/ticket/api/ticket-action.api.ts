import { AxiosInstance } from '@/core/axios.instance'
import { Customer } from '@/modules/customer'
import type { DiscountType } from '@/modules/enum'
import { Payment } from '@/modules/payment'
import { TicketProduct } from '@/modules/ticket-product'
import type { BaseResponse } from '../../_base/base-dto'
import { Ticket } from '../ticket.model'

export type TicketItemChangeMoney = {
  id: number
  quantity: number
  discountPercent: number
  discountMoney: number
  discountType: DiscountType
  actualPrice: number
}

export class TicketActionApi {
  static async startExecuting(params: { ticketId: number }) {
    const { ticketId } = params
    const response = await AxiosInstance.post(`/ticket/${ticketId}/start-executing`)
    const { data } = response.data as BaseResponse<{ ticketModified: any }>
    return {
      ticket: Ticket.from(data.ticketModified),
    }
  }

  static async changeDiscount(
    ticketId: number,
    body: {
      discountType: DiscountType
      discountMoney: number
      discountPercent: number
    },
  ) {
    const response = await AxiosInstance.post(`/ticket/${ticketId}/change-discount`, {
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
    const response = await AxiosInstance.post(`/ticket/${ticketId}/change-all-money`, body)
    const { data } = response.data as BaseResponse<{ ticket: any }>
    return Ticket.from(data.ticket)
  }

  static async sendProduct(body: { ticketId: number; ticketProductIdList: number[] }) {
    const { ticketId, ticketProductIdList } = body
    const response = await AxiosInstance.post(`/ticket/${ticketId}/send-product`, {
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
    const response = await AxiosInstance.post(`/ticket/${ticketId}/return-product`, {
      returnList,
    })
    const { data } = response.data as BaseResponse
    return data
  }

  static async close(options: { ticketId: number }) {
    const { ticketId } = options
    const response = await AxiosInstance.post(`/ticket/${ticketId}/close`)
    const { data } = response.data as BaseResponse<{
      ticketModified: any
      customerModified?: any
      paymentCreatedList: any[]
    }>
    return {
      ticketModified: Ticket.from(data.ticketModified),
      customerModified: data.customerModified ? Customer.from(data.customerModified) : undefined,
      paymentCreatedList: Payment.fromList(data.paymentCreatedList),
    }
  }

  static async reopen(options: { ticketId: number }) {
    const { ticketId } = options
    const response = await AxiosInstance.post(`/ticket/${ticketId}/reopen`)
    const { data } = response.data as BaseResponse<{
      ticketModified: any
      customerModified: any
      paymentCreatedList: any[]
    }>
    return {
      ticketModified: Ticket.from(data.ticketModified),
      customerModified: data.customerModified ? Customer.from(data.customerModified) : undefined,
      paymentCreatedList: Payment.fromList(data.paymentCreatedList),
    }
  }

  static async terminate(options: { ticketId: number }) {
    const { ticketId } = options
    const response = await AxiosInstance.post(`/ticket/${ticketId}/terminate`)
    const { data } = response.data as BaseResponse<{
      ticketModified: any
      customerModified?: any
      paymentCreatedList: any[]
      ticketProductModifiedAll?: any[]
    }>
    return {
      ticketModified: Ticket.from(data.ticketModified),
      customerModified: data.customerModified ? Customer.from(data.customerModified) : undefined,
      paymentCreatedList: Payment.fromList(data.paymentCreatedList),
      ticketProductModifiedAll: data.ticketProductModifiedAll
        ? TicketProduct.fromList(data.ticketProductModifiedAll)
        : undefined,
    }
  }

  static async destroy(ticketId: number) {
    const response = await AxiosInstance.delete(`/ticket/${ticketId}/destroy`)
    const { data } = response.data as BaseResponse<{ ticketId: any }>
    return data
  }
}
