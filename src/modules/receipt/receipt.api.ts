import { AxiosInstance } from '../../core/axios.instance'
import type { ApiPaginationResponse } from '../pagination'
import { Product } from '../product'
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
    const data = response.data as ApiPaginationResponse
    return {
      total: data.total,
      page: data.page,
      limit: data.limit,
      data: Receipt.fromPlains(data.data),
    }
  }

  static async list(options: ReceiptListQuery) {
    const params = ReceiptGetQuery.toQuery(options)

    const { data } = await AxiosInstance.get('/receipt/list', { params })
    return Receipt.fromPlains(data)
  }

  static async detail(id: number, options: ReceiptDetailQuery): Promise<Receipt> {
    const params = ReceiptGetQuery.toQuery(options)

    const { data } = await AxiosInstance.get(`/receipt/detail/${id}`, { params })
    return Receipt.fromPlain(data)
  }

  static async createBasic(receipt: Receipt) {
    const receiptDto = Receipt.toPlain(receipt, 'CREATE')
    const { data } = await AxiosInstance.post('/receipt/create-basic', receiptDto)
    return data as { receiptId: number }
  }

  static async updateBasic(oldReceiptId: number, receipt: Receipt) {
    const receiptDto = Receipt.toPlain(receipt, 'CREATE') // tạo phiếu mới đè lên phiếu cũ
    const { data } = await AxiosInstance.patch(`/receipt/update-basic/${oldReceiptId}`, receiptDto)
    return data as { receiptId: number }
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
    return data as { receiptId: number }
  }

  static async prepayment(receiptId: number, money: number) {
    const { data } = await AxiosInstance.post(`/receipt/prepayment/${receiptId}`, { money })
    return data as { receiptId: number }
  }

  static async startShipAndPayment(receiptId: number, money: number) {
    const { data } = await AxiosInstance.post(`/receipt/start-ship-and-payment/${receiptId}`, {
      money,
    })
    return data as { receiptId: number }
  }

  static async payDebt(receiptId: number, money: number) {
    const { data } = await AxiosInstance.post(`/receipt/pay-debt/${receiptId}`, { money })
    return data as { receiptId: number }
  }

  static async startRefund(receiptId: number) {
    const { data } = await AxiosInstance.post(`/receipt/start-refund/${receiptId}`)
    return data as { receiptId: number }
  }

  static async softDeleteRefund(receiptId: number) {
    const { data } = await AxiosInstance.delete(`/receipt/soft-delete-refund/${receiptId}`)
    return data as { receiptId: number }
  }
}
