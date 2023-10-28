import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { USER_CREATE, USER_UPDATE } from '../_base/base-expose'
import {
  ReceiptDetailQuery,
  ReceiptGetQuery,
  ReceiptListQuery,
  ReceiptPaginationQuery,
} from './receipt.dto'
import { Receipt } from './receipt.model'

export class ReceiptApi {
  static async pagination(options: ReceiptPaginationQuery) {
    const params = ReceiptGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/receipt/pagination', { params })
    const { data, meta } = response.data as BaseResponse
    return {
      meta,
      data: Receipt.fromPlains(data),
    }
  }

  static async list(options: ReceiptListQuery) {
    const params = ReceiptGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/receipt/list', { params })
    const { data } = response.data as BaseResponse
    return Receipt.fromPlains(data)
  }

  static async detail(id: number, options: ReceiptDetailQuery): Promise<Receipt> {
    const params = ReceiptGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/receipt/detail/${id}`, { params })
    const { data } = response.data as BaseResponse
    return Receipt.fromPlain(data)
  }

  static async createBasic(receipt: Receipt) {
    const receiptDto = Receipt.toPlain(receipt, USER_CREATE)
    const response = await AxiosInstance.post('/receipt/create-basic', receiptDto)
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }

  static async updateBasic(oldReceiptId: number, receipt: Receipt) {
    const receiptDto = Receipt.toPlain(receipt, USER_CREATE) // tạo phiếu mới đè lên phiếu cũ
    const response = await AxiosInstance.patch(`/receipt/update-basic/${oldReceiptId}`, receiptDto)
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }

  static async createDraft(receipt: Receipt) {
    const receiptDto = Receipt.toPlain(receipt, USER_CREATE)
    const response = await AxiosInstance.post('/receipt/create-draft', receiptDto)
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }

  static async updateDraft(receiptId: number, receipt: Receipt) {
    const receiptDto = Receipt.toPlain(receipt, USER_UPDATE)
    const response = await AxiosInstance.patch(`/receipt/update-draft/${receiptId}`, receiptDto)
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }

  static async destroyDraft(receiptId: number) {
    const response = await AxiosInstance.delete(`/receipt/destroy-draft/${receiptId}`)
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }

  static async prepayment(receiptId: number, money: number) {
    const response = await AxiosInstance.post(`/receipt/prepayment/${receiptId}`, { money })
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }

  static async startShipAndPayment(receiptId: number, money: number) {
    const response = await AxiosInstance.post(`/receipt/start-ship-and-payment/${receiptId}`, {
      money,
    })
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }

  static async payDebt(receiptId: number, money: number) {
    const response = await AxiosInstance.post(`/receipt/pay-debt/${receiptId}`, { money })
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }

  static async startRefund(receiptId: number) {
    const response = await AxiosInstance.post(`/receipt/start-refund/${receiptId}`)
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }

  static async softDeleteRefund(receiptId: number) {
    const response = await AxiosInstance.delete(`/receipt/soft-delete-refund/${receiptId}`)
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }
}
