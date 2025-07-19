import type { DiscountType } from '@/modules/enum'
import { AxiosInstance } from '../../../core/axios.instance'
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
    const { data } = response.data as BaseResponse
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

  static async close(ticketId: number) {
    const response = await AxiosInstance.post(`/ticket/close/${ticketId}`)
    const { data } = response.data as BaseResponse
  }

  static async reopen(ticketId: number) {
    const response = await AxiosInstance.post(`/ticket/reopen/${ticketId}`)
    const { data } = response.data as BaseResponse
  }

  static async destroy(ticketId: number) {
    const response = await AxiosInstance.delete(`/ticket/destroy/${ticketId}`)
    const { data } = response.data as BaseResponse<{ ticketId: any }>
    return data
  }
}
