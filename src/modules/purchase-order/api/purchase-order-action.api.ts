import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import { Distributor } from '../../distributor'
import { Payment } from '../../payment'
import { PurchaseOrder } from '../purchase-order.model'

export class PurchaseOrderActionApi {
  static async draftDestroy(purchaseOrderId: number) {
    const response = await AxiosInstance.delete(`/purchase-order/${purchaseOrderId}/draft-destroy`)
    const { data } = response.data as BaseResponse<{ purchaseOrderId: number }>
    return data
  }

  static async depositedDestroy(purchaseOrderId: number) {
    const response = await AxiosInstance.delete(`/purchase-order/${purchaseOrderId}/deposited-destroy`)
    const { data } = response.data as BaseResponse<{ purchaseOrderId: number }>
    return data
  }

  static async cancelledDestroy(purchaseOrderId: number) {
    const response = await AxiosInstance.delete(`/purchase-order/${purchaseOrderId}/cancelled-destroy`)
    const { data } = response.data as BaseResponse<{ purchaseOrderId: number }>
    return data
  }

  static async sendProductAndPaymentAndClose(
    purchaseOrderId: number,
    body: {
      distributorId: number
      paymentMethodId: number
      paidAmount: number
      note: string
    },
  ) {
    const response = await AxiosInstance.post(
      `/purchase-order/${purchaseOrderId}/send-product-and-payment-and-close`,
      body,
    )
    const { data } = response.data as BaseResponse<{
      purchaseOrderModified: any
      distributorModified: any
      paymentCreatedList: any[]
    }>
    return {
      purchaseOrderModified: PurchaseOrder.from(data.purchaseOrderModified || {}),
      paymentCreatedList: Payment.fromList(data.paymentCreatedList),
      distributorModified: data.distributorModified
        ? Distributor.from(data.distributorModified)
        : undefined,
    }
  }

  static async sendProduct(options: { purchaseOrderId: number }) {
    const { purchaseOrderId } = options
    const response = await AxiosInstance.post(`/purchase-order/${purchaseOrderId}/send-product`)
    const { data } = response.data as BaseResponse<{ purchaseOrderModified: any }>
    return {
      purchaseOrderModified: PurchaseOrder.from(data.purchaseOrderModified || {}),
    }
  }

  static async close(options: { purchaseOrderId: number }) {
    const { purchaseOrderId } = options
    const response = await AxiosInstance.post(`/purchase-order/${purchaseOrderId}/close`)
    const { data } = response.data as BaseResponse<{
      purchaseOrderModified: any
      paymentCreatedList: any[]
      distributorModified: any
    }>
    return {
      purchaseOrderModified: PurchaseOrder.from(data.purchaseOrderModified),
      paymentCreatedList: Payment.fromList(data.paymentCreatedList || []),
      distributorModified: data.distributorModified
        ? Distributor.from(data.distributorModified)
        : undefined,
    }
  }

  static async terminate(purchaseOrderId: number) {
    const response = await AxiosInstance.post(`/purchase-order/${purchaseOrderId}/terminate`)
    const { data } = response.data as BaseResponse<{
      purchaseOrderModified: any
      paymentCreatedList: any[]
      distributorModified: any
    }>
    return {
      purchaseOrderModified: PurchaseOrder.from(data.purchaseOrderModified),
      paymentCreatedList: Payment.fromList(data.paymentCreatedList || []),
      distributorModified: data.distributorModified
        ? Distributor.from(data.distributorModified)
        : undefined,
    }
  }
}
