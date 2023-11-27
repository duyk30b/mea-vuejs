import { AxiosInstance } from '@/core/axios.instance'
import type { ApiPaginationResponse } from '../pagination'
import { ReceiptDetailQuery, ReceiptListQuery, ReceiptPaginationQuery } from './receipt.dto'
import { Receipt } from './receipt.model'

export class ReceiptService {
  static async pagination(options: ReceiptPaginationQuery) {
    const params = ReceiptPaginationQuery.plainFromPlain(options)

    const response = await AxiosInstance.get('/receipt/pagination', { params })
    const data = response.data as ApiPaginationResponse
    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      data: Receipt.fromPlains(data.data),
    }
  }

  static async list(options: ReceiptListQuery) {
    const params = ReceiptListQuery.plainFromPlain(options)

    const { data } = await AxiosInstance.get('/receipt/list', { params })
    return Receipt.fromPlains(data)
  }

  static async detail(id: number, options: ReceiptDetailQuery): Promise<Receipt> {
    const params = ReceiptDetailQuery.plainFromPlain(options)

    const { data } = await AxiosInstance.get(`/receipt/detail/${id}`, { params })
    return Receipt.fromPlain(data)
  }

  static async createDraft(receipt: Receipt) {
    const receiptDto = Receipt.toPlain(receipt, 'CREATE')
    const { data } = await AxiosInstance.post('/receipt/create-draft', receiptDto)
    return data as { receiptId: number }
  }

  static async updateDraft(receiptId: number, receipt: Receipt) {
    const receiptDto = Receipt.toPlain(receipt, 'UPDATE')
    const { data } = await AxiosInstance.patch(`/receipt/update-draft/${receiptId}`, receiptDto)
    return data as { receiptId: number }
  }

  static async destroyDraft(receiptId: number) {
    const { data } = await AxiosInstance.delete(`/receipt/destroy-draft/${receiptId}`)
    return data as { success: boolean }
  }

  static async prepayment(receiptId: number, money: number) {
    const { data } = await AxiosInstance.post(`/receipt/prepayment/${receiptId}`, { money })
    return { success: data.success as boolean }
  }

  static async startShipAndPayment(receiptId: number, money: number) {
    const { data } = await AxiosInstance.post(`/receipt/start-ship-and-payment/${receiptId}`, { money })
    return { success: data.success as boolean }
  }

  static async payDebt(receiptId: number, money: number) {
    const { data } = await AxiosInstance.post(`/receipt/pay-debt/${receiptId}`, { money })
    return { success: data.success as boolean }
  }

  static async startRefund(receiptId: number) {
    const { data } = await AxiosInstance.post(`/receipt/start-refund/${receiptId}`)
    return data as { success: boolean }
  }

  static async softDeleteRefund(receiptId: number) {
    const { data } = await AxiosInstance.delete(`/receipt/soft-delete-refund/${receiptId}`)
    return data as { success: boolean }
  }
}
