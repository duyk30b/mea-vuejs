import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import type { DiscountType } from '../enum'
import { Payment } from '../payment/payment.model'
import { Ticket } from '../ticket/ticket.model'

export class TicketClinicApi {
  static async startCheckup(params: { ticketId: number }) {
    const response = await AxiosInstance.post(`/ticket-clinic/${params.ticketId}/start-checkup`)
    const { data } = response.data as BaseResponse<boolean>
  }

  static async updateDiagnosis(options: {
    ticketId: number
    note: string
    files: File[]
    imagesChange?: {
      imageIdsKeep: number[]
      filesPosition: number[]
    }
    ticketAttributeChangeList?: { key: string; value: any }[]
    ticketAttributeKeyList: string[]
  }) {
    const { ticketId, imagesChange, ticketAttributeChangeList, files } = options

    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('ticketAttributeKeyList', JSON.stringify(options.ticketAttributeKeyList))
    formData.append('note', options.note)

    if (imagesChange) {
      const imagesChangeStr = JSON.stringify({
        imageIdsKeep: imagesChange.imageIdsKeep,
        filesPosition: imagesChange.filesPosition,
      })
      formData.append('imagesChange', imagesChangeStr)
    }
    if (ticketAttributeChangeList) {
      const ticketAttributeChangeListStr = JSON.stringify(
        ticketAttributeChangeList.map((i) => {
          return { key: i.key, value: i.value }
        }),
      )
      formData.append('ticketAttributeChangeList', ticketAttributeChangeListStr)
    }

    const response = await AxiosInstance.post(
      `/ticket-clinic/${ticketId}/update-diagnosis`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )
    const { data } = response.data as BaseResponse<boolean>
  }

  static async changeDiscount(
    ticketId: number,
    body: {
      discountType: DiscountType
      discountMoney: number
      discountPercent: number
    },
  ) {
    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/change-discount`, {
      discountType: body.discountType,
      discountMoney: body.discountMoney,
      discountPercent: body.discountPercent,
    })
    const { data } = response.data as BaseResponse
  }

  static async prepayment(body: {
    ticketId: number
    money: number
    note: string
    paymentMethodId: number
  }) {
    const { ticketId } = body
    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/prepayment`, {
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
    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/refund-overpaid`, {
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
    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/pay-debt`, {
      money: body.money,
      note: body.note,
      paymentMethodId: body.paymentMethodId,
    })
    const { data } = response.data as BaseResponse
  }

  static async close(ticketId: number) {
    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/close`)
    const { data } = response.data as BaseResponse
  }

  static async reopen(ticketId: number) {
    const response = await AxiosInstance.post(`/ticket-clinic/${ticketId}/reopen`)
    const { data } = response.data as BaseResponse
  }

  static async destroy(ticketId: number) {
    const response = await AxiosInstance.delete(`/ticket-clinic/${ticketId}/destroy`)
    const { data } = response.data as BaseResponse<{ ticketId: any }>
    return data
  }
}
