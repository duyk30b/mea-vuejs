import { AxiosInstance } from '@/core/axios.instance'
import { Customer } from '@/modules/customer'
import type { DiscountType } from '@/modules/enum'
import { Payment } from '@/modules/payment'
import { TicketProduct } from '@/modules/ticket-product'
import type { TicketSurcharge } from '@/modules/ticket-surcharge/ticket-surcharge.model'
import type { FullResponse } from '../../_base/base-dto'
import { Ticket } from '../ticket.model'

export type TicketItemChangeMoney = {
  id: string
  quantity: number
  discountPercent: number
  discountMoney: number
  discountType: DiscountType
  actualPrice: number
}

export type TicketProductChangeMoney = {
  id: string
  unitQuantity: number
  discountPercent: number
  unitDiscountMoney: number
  discountType: DiscountType
  unitActualPrice: number
}

export class TicketActionApi {
  static async startExecuting(params: { ticketId: string }) {
    const { ticketId } = params
    const response = await AxiosInstance.post(`/ticket/${ticketId}/start-executing`)
    const { data } = response.data as FullResponse<{ ticketModified: any }>
    return {
      ticketModified: Ticket.from(data.ticketModified),
    }
  }

  static async changeDiscount(
    ticketId: string,
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
    const { data } = response.data as FullResponse<{ ticketModified: any }>
    return {
      ticketModified: Ticket.from(data.ticketModified),
    }
  }

  static async changeSurchargeList(
    ticketId: string,
    body: {
      ticketSurchargeBodyList: TicketSurcharge[]
    },
  ) {
    const response = await AxiosInstance.post(`/ticket/${ticketId}/change-surcharge-list`, {
      ticketSurchargeBodyList: body.ticketSurchargeBodyList.map((i) => {
        return {
          surchargeId: i.surchargeId,
          money: i.money,
        }
      }),
    })
    const { data } = response.data as FullResponse<{ ticketModified: any }>
    return {
      ticketModified: Ticket.from(data.ticketModified),
    }
  }

  static async changeAllMoney(
    ticketId: string,
    body: {
      ticketProcedureList: TicketItemChangeMoney[]
      ticketProductList: TicketProductChangeMoney[]
      ticketLaboratoryList: TicketItemChangeMoney[]
      ticketRadiologyList: TicketItemChangeMoney[]
    },
  ) {
    const response = await AxiosInstance.post(`/ticket/${ticketId}/change-all-money`, body)
    const { data } = response.data as FullResponse<{ ticketModified: any }>
    return {
      ticketModified: Ticket.from(data.ticketModified),
    }
  }

  static async sendProduct(body: { ticketId: string; ticketProductIdList: string[] }) {
    const { ticketId, ticketProductIdList } = body
    const response = await AxiosInstance.post(`/ticket/${ticketId}/send-product`, {
      ticketProductIdList,
    })
    const { data } = response.data as FullResponse<{
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
    ticketId: string
    returnList: {
      ticketBatchId: string
      unitQuantityReturn: number
      unitRate: number
    }[]
  }) {
    const { ticketId, returnList } = body
    const response = await AxiosInstance.post(`/ticket/${ticketId}/return-product`, {
      returnList,
    })
    const { data } = response.data as FullResponse<{
      ticketModified: any
      ticketProductModifiedAll?: any[]
    }>
    return data
  }

  static async close(options: { ticketId: string }) {
    const { ticketId } = options
    const response = await AxiosInstance.post(`/ticket/${ticketId}/close`)
    const { data } = response.data as FullResponse<{
      ticketModified: any
      customerModified?: any
      paymentCreated: any
    }>
    return {
      ticketModified: Ticket.from(data.ticketModified),
      paymentCreated: data.paymentCreated ? Payment.from(data.paymentCreated) : undefined,
    }
  }

  static async reopen(options: { ticketId: string }) {
    const { ticketId } = options
    const response = await AxiosInstance.post(`/ticket/${ticketId}/reopen`)
    const { data } = response.data as FullResponse<{
      ticketModified: any
    }>
    return {
      ticketModified: Ticket.from(data.ticketModified),
    }
  }

  static async terminate(options: { ticketId: string; walletId: string; note: string }) {
    const { ticketId } = options
    const response = await AxiosInstance.post(`/ticket/${ticketId}/terminate`, {
      walletId: options.walletId,
      note: options.note,
    })
    const { data } = response.data as FullResponse<{
      ticketModified: any
      customerModified?: any
      paymentCreated: any
      ticketProductModifiedAll?: any[]
    }>
    return {
      ticketModified: Ticket.from(data.ticketModified),
      customerModified: data.customerModified ? Customer.from(data.customerModified) : undefined,
      paymentCreated: data.paymentCreated ? Payment.from(data.paymentCreated) : undefined,
      ticketProductModifiedAll: data.ticketProductModifiedAll
        ? TicketProduct.fromList(data.ticketProductModifiedAll)
        : undefined,
    }
  }

  static async destroy(ticketId: string) {
    const response = await AxiosInstance.post(`/ticket/${ticketId}/destroy`)
    const { data } = response.data as FullResponse<{ ticketId: any }>
    return data
  }
}
