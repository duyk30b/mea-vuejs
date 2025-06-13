import { AxiosInstance } from '../../core/axios.instance'
import type { BaseResponse } from '../_base/base-dto'
import { Payment } from '../payment/payment.model'
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

    const response = await AxiosInstance.get(`/receipt/${id}/detail`, { params })
    const { data } = response.data as BaseResponse<{ receipt: any }>
    return Receipt.from(data.receipt)
  }

  static async createDraft(receipt: Receipt) {
    const response = await AxiosInstance.post('/receipt/create-draft', {
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
        lotNumber: i.lotNumber || '',
        expiryDate: i.expiryDate,
        unitRate: i.unitRate,
        quantity: i.quantity,
        costPrice: i.costPrice,
        listPrice: i.listPrice,
      })),
    })
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }

  static async updateDraft(receiptId: number, receipt: Receipt) {
    const response = await AxiosInstance.patch(`/receipt/${receiptId}/update-draft`, {
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
        lotNumber: i.lotNumber || '',
        expiryDate: i.expiryDate,
        unitRate: i.unitRate,
        quantity: i.quantity,
        costPrice: i.costPrice,
        listPrice: i.listPrice,
      })),
    })
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }

  static async depositedUpdate(receiptId: number, receipt: Receipt) {
    const response = await AxiosInstance.patch(`/receipt/${receiptId}/deposited-update`, {
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
        lotNumber: i.lotNumber || '',
        expiryDate: i.expiryDate,
        unitRate: i.unitRate,
        quantity: i.quantity,
        costPrice: i.costPrice,
        listPrice: i.listPrice,
      })),
    })
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }

  // ================ ACTION ================ //

  static async draftDestroy(receiptId: number) {
    const response = await AxiosInstance.delete(`/receipt/${receiptId}/draft-destroy`)
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }

  static async depositedDestroy(receiptId: number) {
    const response = await AxiosInstance.delete(`/receipt/${receiptId}/deposited-destroy`)
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }

  static async cancelledDestroy(receiptId: number) {
    const response = await AxiosInstance.delete(`/receipt/${receiptId}/cancelled-destroy`)
    const { data } = response.data as BaseResponse<{ receiptId: number }>
    return data
  }

  static async sendProductAndPaymentAndClose(options: {
    receiptId: number
    money: number
    paymentMethodId: number
  }) {
    const { receiptId, money, paymentMethodId } = options
    const response = await AxiosInstance.post(
      `/receipt/${receiptId}/send-product-and-payment-and-close`,
      {
        money,
        paymentMethodId,
      },
    )
    const { data } = response.data as BaseResponse<{ receipt: any; payment: any }>
    return {
      receipt: Receipt.from(data.receipt || {}),
      payment: data.payment ? Payment.from(data.payment) : undefined,
    }
  }

  static async prepayment(options: { receiptId: number; money: number; paymentMethodId: number }) {
    const { receiptId, money, paymentMethodId } = options
    const response = await AxiosInstance.post(`/receipt/${receiptId}/prepayment`, {
      money,
      paymentMethodId,
    })
    const { data } = response.data as BaseResponse<{ receipt: any; payment?: any }>
    return {
      receipt: Receipt.from(data.receipt || {}),
      payment: data.payment ? Payment.from(data.payment) : undefined,
    }
  }

  static async sendProduct(options: { receiptId: number }) {
    const { receiptId } = options
    const response = await AxiosInstance.post(`/receipt/${receiptId}/send-product`)
    const { data } = response.data as BaseResponse<{ receipt: any }>
    return {
      receipt: Receipt.from(data.receipt || {}),
    }
  }

  static async close(options: { receiptId: number }) {
    const { receiptId } = options
    const response = await AxiosInstance.post(`/receipt/${receiptId}/close`)
    const { data } = response.data as BaseResponse<{ receipt: any; payment: any }>
    return {
      receipt: Receipt.from(data.receipt || {}),
      payment: data.payment ? Payment.from(data.payment) : undefined,
    }
  }

  static async refundOverpaid(options: {
    receiptId: number
    money: number
    paymentMethodId: number
  }) {
    const { receiptId, money, paymentMethodId } = options
    const response = await AxiosInstance.post(`/receipt/${receiptId}/refund-overpaid`, {
      money,
      paymentMethodId,
    })
    const { data } = response.data as BaseResponse<{ receipt: any; payment: any }>
    return {
      receipt: Receipt.from(data.receipt || {}),
      payment: data.payment ? Payment.from(data.payment) : undefined,
    }
  }

  static async payDebt(options: { receiptId: number; money: number; paymentMethodId: number }) {
    const { receiptId, money, paymentMethodId } = options
    const response = await AxiosInstance.post(`/receipt/${receiptId}/pay-debt`, {
      money,
      paymentMethodId,
    })
    const { data } = response.data as BaseResponse<{ receipt: any; payment: any }>
    return {
      receipt: Receipt.from(data.receipt || {}),
      payment: data.payment ? Payment.from(data.payment) : undefined,
    }
  }

  static async terminate(receiptId: number) {
    const response = await AxiosInstance.post(`/receipt/${receiptId}/terminate`)
    const { data } = response.data as BaseResponse<{
      receipt: any
      paymentList: any[]
    }>
    return {
      receipt: Receipt.from(data.receipt),
      paymentList: Payment.fromList(data.paymentList || []),
    }
  }
}
