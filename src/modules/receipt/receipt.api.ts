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

  static async createReceiptDraft(receipt: Receipt) {
    const response = await AxiosInstance.post('/receipt/create-receipt-draft', {
      distributorId: receipt.distributorId,
      receipt: {
        startedAt: receipt.startedAt,
        itemsActualMoney: receipt.itemsActualMoney,
        discountMoney: receipt.discountMoney,
        discountPercent: receipt.discountPercent,
        discountType: receipt.discountType,
        surcharge: receipt.surcharge,
        totalMoney: receipt.totalMoney,
        note: receipt.note,
      },
      receiptItemList: (receipt.receiptItemList || []).map((i) => ({
        productId: i.productId,
        batchId: i.batchId,
        warehouseId: i.warehouseId,
        batchCode: i.batchCode || '',
        expiryDate: i.expiryDate,
        unitRate: i.unitRate,
        costPrice: i.costPrice,
        quantity: i.quantity,
      })),
    })
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }

  static async updateReceiptDraft(receiptId: number, receipt: Receipt) {
    const response = await AxiosInstance.patch(`/receipt/update-receipt-draft/${receiptId}`, {
      distributorId: receipt.distributorId, // sửa thì không cho thay đổi distributor
      receipt: {
        startedAt: receipt.startedAt,
        itemsActualMoney: receipt.itemsActualMoney,
        discountMoney: receipt.discountMoney,
        discountPercent: receipt.discountPercent,
        discountType: receipt.discountType,
        surcharge: receipt.surcharge,
        totalMoney: receipt.totalMoney,
        note: receipt.note,
      },
      receiptItemList: (receipt.receiptItemList || []).map((i) => ({
        productId: i.productId,
        batchId: i.batchId,
        warehouseId: i.warehouseId,
        batchCode: i.batchCode || '',
        expiryDate: i.expiryDate,
        unitRate: i.unitRate,
        costPrice: i.costPrice,
        quantity: i.quantity,
      })),
    })
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }

  static async updateReceiptPrepayment(receiptId: number, receipt: Receipt) {
    const response = await AxiosInstance.patch(`/receipt/update-receipt-prepayment/${receiptId}`, {
      distributorId: receipt.distributorId, // sửa thì không cho thay đổi distributor
      receipt: {
        startedAt: receipt.startedAt,
        itemsActualMoney: receipt.itemsActualMoney,
        discountMoney: receipt.discountMoney,
        discountPercent: receipt.discountPercent,
        discountType: receipt.discountType,
        surcharge: receipt.surcharge,
        totalMoney: receipt.totalMoney,
        note: receipt.note,
      },
      receiptItemList: (receipt.receiptItemList || []).map((i) => ({
        productId: i.productId,
        batchId: i.batchId,
        warehouseId: i.warehouseId,
        batchCode: i.batchCode || '',
        expiryDate: i.expiryDate,
        unitRate: i.unitRate,
        costPrice: i.costPrice,
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
      distributorPaymentList: any[]
    }>
    return {
      receiptBasic: Receipt.from(data.receiptBasic || {}),
      distributorPaymentList: DistributorPayment.fromList(data.distributorPaymentList || []),
    }
  }

  static async refundPrepayment(receiptId: number, money: number) {
    const response = await AxiosInstance.post(`/receipt/refund-prepayment/${receiptId}`, { money })
    const { data } = response.data as BaseResponse<{
      receiptBasic: any
      distributorPaymentList: any[]
    }>
    return {
      receiptBasic: Receipt.from(data.receiptBasic || {}),
      distributorPaymentList: DistributorPayment.fromList(data.distributorPaymentList || []),
    }
  }

  static async sendProductAndPayment(receiptId: number, money: number) {
    const response = await AxiosInstance.post(`/receipt/send-product-and-payment/${receiptId}`, {
      money,
    })
    const { data } = response.data as BaseResponse<{
      receipt: any
      distributorPaymentList: any[]
    }>
    return {
      receipt: Receipt.from(data.receipt || {}),
      distributorPaymentList: DistributorPayment.fromList(data.distributorPaymentList || []),
    }
  }

  static async payDebt(receiptId: number, money: number) {
    const response = await AxiosInstance.post(`/receipt/pay-debt/${receiptId}`, { money })
    const { data } = response.data as BaseResponse<{
      receiptBasic: any
      distributorPaymentList: any[]
    }>
    return {
      receiptBasic: Receipt.from(data.receiptBasic || {}),
      distributorPaymentList: DistributorPayment.fromList(data.distributorPaymentList || []),
    }
  }

  static async cancel(receiptId: number) {
    const response = await AxiosInstance.post(`/receipt/cancel/${receiptId}`)
    const { data } = response.data as BaseResponse<{
      receipt: any
      distributorPaymentList: any[]
    }>
    return {
      receipt: Receipt.from(data.receipt),
      distributorPaymentList: DistributorPayment.fromList(data.distributorPaymentList || []),
    }
  }

  static async downloadFileUploadExcelExample() {
    const response = await AxiosInstance.get(`/file-receipt/upload-excel/file-example`)
    const { data } = response.data as BaseResponse<{
      buffer: { type: 'Buffer'; data: any[] }
      mimeType: string
      filename: string
    }>
    const uint8Array = new Uint8Array(data.buffer.data)
    const blob = new Blob([uint8Array], {
      type: data.mimeType,
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = data.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  static async uploadExcelForCreateDraft(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const response = await AxiosInstance.post(
      `/file-receipt/upload-excel-for-create-draft`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            console.log(`Đã upload: ${percentCompleted}%`)
          }
        },
      },
    )
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }
}
