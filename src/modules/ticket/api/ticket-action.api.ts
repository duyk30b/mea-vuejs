import { AxiosInstance } from '@/core/axios.instance'
import { Customer } from '@/modules/customer'
import type { DiscountType } from '@/modules/enum'
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

  static async shipProductList(props: {
    ticketId: string
    body: { shipProductList: { ticketProductId: string; quantityExecute: number }[] }
  }) {
    const { ticketId, body } = props
    const response = await AxiosInstance.post(`/ticket/${ticketId}/ship-product-list`, body)
    const { data } = response.data as FullResponse<{
      ticketModified: any
      ticketProductModifiedAll: any[]
    }>
    return {
      ticketModified: Ticket.from(data.ticketModified),
      ticketProductModifiedAll: TicketProduct.fromList(data.ticketProductModifiedAll),
    }
  }

  static async shipProductAll(props: { ticketId: string }) {
    const { ticketId } = props
    const response = await AxiosInstance.post(`/ticket/${ticketId}/ship-product-all`)
    const { data } = response.data as FullResponse<{
      ticketModified: any
      ticketProductModifiedAll: any[]
    }>
    return {
      ticketModified: Ticket.from(data.ticketModified),
      ticketProductModifiedAll: TicketProduct.fromList(data.ticketProductModifiedAll),
    }
  }

  static async returnProductList(props: {
    ticketId: string
    body: {
      returnProductList: { ticketBatchId: string; quantityExecute: number }[]
    }
  }) {
    const { ticketId, body } = props
    const response = await AxiosInstance.post(`/ticket/${ticketId}/return-product-list`, body)
    const { data } = response.data as FullResponse<{
      ticketModified: any
      ticketProductModifiedAll: any[]
    }>
    return {
      ticketModified: Ticket.from(data.ticketModified),
      ticketProductModifiedAll: TicketProduct.fromList(data.ticketProductModifiedAll),
    }
  }

  static async returnProductAll(props: { ticketId: string }) {
    const { ticketId } = props
    const response = await AxiosInstance.post(`/ticket/${ticketId}/return-product-all`)
    const { data } = response.data as FullResponse<{
      ticketModified: any
      ticketProductModifiedAll: any[]
    }>
    return {
      ticketModified: Ticket.from(data.ticketModified),
      ticketProductModifiedAll: TicketProduct.fromList(data.ticketProductModifiedAll),
    }
  }

  static async close(props: { ticketId: string }) {
    const { ticketId } = props
    const response = await AxiosInstance.post(`/ticket/${ticketId}/close`)
    const { data } = response.data as FullResponse<{ ticketModified: any }>
    return { ticketModified: Ticket.from(data.ticketModified) }
  }

  static async reopen(props: { ticketId: string }) {
    const { ticketId } = props
    const response = await AxiosInstance.post(`/ticket/${ticketId}/reopen`)
    const { data } = response.data as FullResponse<{ ticketModified: any }>
    return { ticketModified: Ticket.from(data.ticketModified) }
  }

  static async terminate(props: { ticketId: string; body: { walletId: string; note: string } }) {
    const { ticketId, body } = props
    const response = await AxiosInstance.post(`/ticket/${ticketId}/terminate`, body)
    const { data } = response.data as FullResponse<{
      ticketModified: any
      customerModified: any
      ticketProductModifiedAll?: any[]
    }>
    return {
      ticketModified: Ticket.from(data.ticketModified),
    }
  }

  static async destroy(ticketId: string) {
    const response = await AxiosInstance.post(`/ticket/${ticketId}/destroy`)
    const { data } = response.data as FullResponse<{ ticketDestroyed: any }>
    return data
  }
}
