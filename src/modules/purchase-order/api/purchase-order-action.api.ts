import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import { Distributor } from '../../distributor'
import { Payment } from '../../payment'
import { PurchaseOrder } from '../purchase-order.model'

export class PurchaseOrderActionApi {
  static async destroy(purchaseOrderId: string) {
    const response = await AxiosInstance.delete(`/purchase-order/${purchaseOrderId}/destroy`)
    const { data } = response.data as BaseResponse<{ purchaseOrderId: string }>
    return data
  }

  static async sendProductAndPaymentAndClose(
    purchaseOrderId: string,
    body: {
      walletId: string
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

  static async sendProduct(options: { purchaseOrderId: string }) {
    const { purchaseOrderId } = options
    const response = await AxiosInstance.post(`/purchase-order/${purchaseOrderId}/send-product`)
    const { data } = response.data as BaseResponse<{ purchaseOrderModified: any }>
    return {
      purchaseOrderModified: PurchaseOrder.from(data.purchaseOrderModified || {}),
    }
  }

  static async close(options: { purchaseOrderId: string }) {
    const { purchaseOrderId } = options
    const response = await AxiosInstance.post(`/purchase-order/${purchaseOrderId}/close`)
    const { data } = response.data as BaseResponse<{
      purchaseOrderModified: any
      paymentCreated: any
      distributorModified: any
    }>
    return {
      purchaseOrderModified: PurchaseOrder.from(data.purchaseOrderModified),
      paymentCreated: data.paymentCreated ? Payment.from(data.paymentCreated) : undefined,
      distributorModified: data.distributorModified
        ? Distributor.from(data.distributorModified)
        : undefined,
    }
  }

  static async terminate(props: { purchaseOrderId: string; walletId: string; note: string }) {
    const { purchaseOrderId, walletId, note } = props
    const response = await AxiosInstance.post(`/purchase-order/${purchaseOrderId}/terminate`, {
      walletId,
      note,
    })
    const { data } = response.data as BaseResponse<{
      purchaseOrderModified: any
      paymentCreated: any
      distributorModified: any
    }>
    return {
      purchaseOrderModified: PurchaseOrder.from(data.purchaseOrderModified),
      paymentCreated: data.paymentCreated ? Payment.from(data.paymentCreated) : undefined,
      distributorModified: data.distributorModified
        ? Distributor.from(data.distributorModified)
        : undefined,
    }
  }
}
