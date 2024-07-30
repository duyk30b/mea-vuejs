import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { DistributorPayment } from '../distributor-payment/distributor-payment.model'
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
      data: Receipt.fromList(data),
    }
  }

  static async list(options: ReceiptListQuery) {
    const params = ReceiptGetQuery.toQuery(options)

    const response = await AxiosInstance.get('/receipt/list', { params })
    const { data } = response.data as BaseResponse
    return Receipt.fromList(data)
  }

  static async detail(id: number, options: ReceiptDetailQuery): Promise<Receipt> {
    const params = ReceiptGetQuery.toQuery(options)

    const response = await AxiosInstance.get(`/receipt/detail/${id}`, { params })
    const { data } = response.data as BaseResponse<{ receipt: any }>
    return Receipt.from(data.receipt)
  }

  static async createDraft(receipt: Receipt) {
    const response = await AxiosInstance.post('/receipt/create-draft', {
      receipt: {
        distributorId: receipt.distributorId,
        startedAt: receipt.startedAt,
        itemsActualMoney: receipt.itemsActualMoney,
        discountMoney: receipt.discountMoney,
        discountPercent: receipt.discountPercent,
        discountType: receipt.discountType,
        surcharge: receipt.surcharge,
        totalMoney: receipt.totalMoney,
        note: receipt.note,
      },
      receiptItemList: (receipt.receiptItems || []).map((i) => ({
        productId: i.productId,
        batchId: i.batchId,
        lotNumber: i.lotNumber || '',
        expiryDate: i.expiryDate,
        unitRate: i.unitRate,
        costPrice: i.costPrice,
        wholesalePrice: i.wholesalePrice,
        retailPrice: i.retailPrice,
        quantity: i.quantity,
      })),
    })
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }

  static async updateDraftPrepayment(receiptId: number, receipt: Receipt) {
    const response = await AxiosInstance.patch(`/receipt/update-draft-prepayment/${receiptId}`, {
      receipt: {
        // distributorId: receipt.distributorId, // sửa thì không cho thay đổi distributor
        startedAt: receipt.startedAt,
        itemsActualMoney: receipt.itemsActualMoney,
        discountMoney: receipt.discountMoney,
        discountPercent: receipt.discountPercent,
        discountType: receipt.discountType,
        surcharge: receipt.surcharge,
        totalMoney: receipt.totalMoney,
        note: receipt.note,
      },
      receiptItemList: (receipt.receiptItems || []).map((i) => ({
        productId: i.productId,
        batchId: i.batchId,
        lotNumber: i.lotNumber || '',
        expiryDate: i.expiryDate,
        unitRate: i.unitRate,
        costPrice: i.costPrice,
        wholesalePrice: i.wholesalePrice,
        retailPrice: i.retailPrice,
        quantity: i.quantity,
      })),
    })
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }

  static async destroy(receiptId: number) {
    const response = await AxiosInstance.delete(`/receipt/destroy/${receiptId}`)
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
      receiptBasic: Receipt.from(data.receiptBasic || {}),
      distributorPayments: DistributorPayment.fromList(data.distributorPayments || []),
    }
  }

  static async refundPrepayment(receiptId: number, money: number) {
    const response = await AxiosInstance.post(`/receipt/refund-prepayment/${receiptId}`, { money })
    const { data } = response.data as BaseResponse<{
      receiptBasic: any
      distributorPayments: any[]
    }>
    return {
      receiptBasic: Receipt.from(data.receiptBasic || {}),
      distributorPayments: DistributorPayment.fromList(data.distributorPayments || []),
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
      receiptBasic: Receipt.from(data.receiptBasic || {}),
      distributorPayments: DistributorPayment.fromList(data.distributorPayments || []),
    }
  }

  static async payDebt(receiptId: number, money: number) {
    const response = await AxiosInstance.post(`/receipt/pay-debt/${receiptId}`, { money })
    const { data } = response.data as BaseResponse<{
      receiptBasic: any
      distributorPayments: any[]
    }>
    return {
      receiptBasic: Receipt.from(data.receiptBasic || {}),
      distributorPayments: DistributorPayment.fromList(data.distributorPayments || []),
    }
  }

  static async cancel(receiptId: number, money: number) {
    const response = await AxiosInstance.post(`/receipt/cancel/${receiptId}`, { money })
    const { data } = response.data as BaseResponse<{
      receiptBasic: any
      distributorPaymentList: any[]
    }>
    return {
      receiptBasic: Receipt.from(data.receiptBasic || {}),
      distributorPaymentList: DistributorPayment.fromList(data.distributorPaymentList || []),
    }
  }
}
