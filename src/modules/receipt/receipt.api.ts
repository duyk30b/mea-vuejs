import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { USER_CREATE, USER_UPDATE } from '../_base/base-expose'
import { DistributorPayment } from '../distributor-payment/distributor-payment.model'
import { ReceiptItem } from '../receipt-item/receipt-item.model'
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
    return Receipt.fromPlain(data || {})
  }

  static async createDraft(instance: Receipt) {
    const body = {
      receipt: Receipt.toPlain(instance, 'USER_CREATE'),
      receiptItemList: ReceiptItem.toPlains(instance.receiptItems || [], 'USER_CREATE'),
    }
    const response = await AxiosInstance.post('/receipt/create-draft', body)
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
    const { data } = response.data as BaseResponse<{
      receiptBasic: any
      distributorPayments: any[]
    }>
    return {
      receiptBasic: Receipt.toBasic(data.receiptBasic || {}),
      distributorPayments: DistributorPayment.toBasics(data.distributorPayments || []),
    }
  }

  static async refundPrepayment(receiptId: number, money: number) {
    const response = await AxiosInstance.post(`/receipt/refund-prepayment/${receiptId}`, { money })
    const { data } = response.data as BaseResponse<{
      receiptBasic: any
      distributorPayments: any[]
    }>
    return {
      receiptBasic: Receipt.toBasic(data.receiptBasic || {}),
      distributorPayments: DistributorPayment.toBasics(data.distributorPayments || []),
    }
  }

  static async sendProductAndPayment(receiptId: number, money: number) {
    const response = await AxiosInstance.post(`/receipt/send-product-and-payment/${receiptId}`, {
      money,
    })
    const { data } = response.data as BaseResponse<{
      receiptBasic: any
      distributorPayments: any[]
    }>
    return {
      receiptBasic: Receipt.toBasic(data.receiptBasic || {}),
      distributorPayments: DistributorPayment.toBasics(data.distributorPayments || []),
    }
  }

  static async payDebt(receiptId: number, money: number) {
    const response = await AxiosInstance.post(`/receipt/pay-debt/${receiptId}`, { money })
    const { data } = response.data as BaseResponse<{
      receiptBasic: any
      distributorPayments: any[]
    }>
    return {
      receiptBasic: Receipt.toBasic(data.receiptBasic || {}),
      distributorPayments: DistributorPayment.toBasics(data.distributorPayments || []),
    }
  }

  static async returnProduct(receiptId: number, money: number) {
    const response = await AxiosInstance.post(`/receipt/return-product/${receiptId}`, { money })
    const { data } = response.data as BaseResponse<{
      receiptBasic: any
      distributorPayments: any[]
    }>
    return {
      receiptBasic: Receipt.toBasic(data.receiptBasic || {}),
      distributorPayments: DistributorPayment.toBasics(data.distributorPayments || []),
    }
  }

  static async softDeleteRefund(receiptId: number) {
    const response = await AxiosInstance.delete(`/receipt/soft-delete-refund/${receiptId}`)
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }

  static async createQuickReceipt(instance: Receipt) {
    const body = {
      receipt: Receipt.toPlain(instance, 'USER_CREATE'),
      receiptItemList: ReceiptItem.toPlains(instance.receiptItems || [], 'USER_CREATE'),
    }
    const response = await AxiosInstance.post('/receipt/create-quick-receipt', body)
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }

  static async updateReceiptDraftAndReceiptPrepayment(receiptId: number, instance: Receipt) {
    const body = {
      receipt: Receipt.toPlain(instance, 'USER_UPDATE'),
      receiptItemList: ReceiptItem.toPlains(instance.receiptItems || [], 'USER_UPDATE'),
    }
    const response = await AxiosInstance.patch(
      `/receipt/update-receipt-draft-and-receipt-prepayment/${receiptId}`,
      body
    )
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }

  static async updateReceiptDebtAndReceiptSuccess(receiptId: number, instance: Receipt) {
    const body = {
      receipt: Receipt.toPlain(instance, 'USER_CREATE'),
      receiptItemList: ReceiptItem.toPlains(instance.receiptItems || [], 'USER_CREATE'),
    }
    const response = await AxiosInstance.patch(
      `/receipt/update-receipt-debt-and-receipt-success/${receiptId}`,
      body
    )
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }
}
