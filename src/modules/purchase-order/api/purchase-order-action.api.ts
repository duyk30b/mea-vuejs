import { AxiosInstance } from '@/core/axios.instance'
import { PurchaseOrderItem } from '@/modules/purchase-order-item'
import type { FullResponse } from '../../_base/base-dto'
import { PurchaseOrder } from '../purchase-order.model'
import { PurchaseOrderActionType } from '../purchase-order.type'
import { PaymentActionType } from '@/modules/payment/payment.type'

export class PurchaseOrderActionApi {
  static async receiveProductList(props: {
    purchaseOrderId: string
    body: { receiveList: { purchaseOrderItemId: string; quantityExecute: number }[] }
  }) {
    const { purchaseOrderId } = props
    const response = await AxiosInstance.post(
      `/purchase-order/${purchaseOrderId}/receive-product-list`,
      props.body,
    )
    const { data } = response.data as FullResponse<{
      purchaseOrderModified: any
      purchaseOrderItemModifiedAll: any[]
    }>
    return {
      purchaseOrderModified: PurchaseOrder.from(data.purchaseOrderModified || {}),
      purchaseOrderItemModifiedAll: PurchaseOrderItem.fromList(
        data.purchaseOrderItemModifiedAll || [],
      ),
    }
  }

  static async receiveProductAll(props: { purchaseOrderId: string }) {
    const { purchaseOrderId } = props
    const response = await AxiosInstance.post(
      `/purchase-order/${purchaseOrderId}/receive-product-all`,
    )
    const { data } = response.data as FullResponse<{ purchaseOrderModified: any }>
    return {
      purchaseOrderModified: PurchaseOrder.from(data.purchaseOrderModified || {}),
    }
  }

  static async receiveProductAndPaymentAndClose(
    purchaseOrderId: string,
    body: {
      walletId: string
      paidTotal: number
      note: string
    },
  ) {
    const response = await AxiosInstance.post(
      `/purchase-order/${purchaseOrderId}/receive-product-and-payment-and-close`,
      {
        walletId: body.walletId,
        paidTotal: body.paidTotal,
        paymentActionType: PaymentActionType.PaymentMoney,
        purchaseOrderActionType: PurchaseOrderActionType.ReceiveProductAndPaymentAndClose,
        note: body.note,
      },
    )
    const { data } = response.data as FullResponse<{
      purchaseOrderModified: any
      purchaseOrderItemModifiedAll: any[]
    }>
    return {
      purchaseOrderModified: PurchaseOrder.from(data.purchaseOrderModified || {}),
      purchaseOrderItemModifiedAll: PurchaseOrderItem.fromList(
        data.purchaseOrderItemModifiedAll || [],
      ),
    }
  }

  static async returnProductList(props: {
    purchaseOrderId: string
    body: { returnList: { purchaseOrderItemId: string; quantityExecute: number }[] }
  }) {
    const { purchaseOrderId } = props
    const response = await AxiosInstance.post(
      `/purchase-order/${purchaseOrderId}/return-product-list`,
      props.body,
    )
    const { data } = response.data as FullResponse<{
      purchaseOrderModified: any
      purchaseOrderItemModifiedAll: any[]
    }>
    return {
      purchaseOrderModified: PurchaseOrder.from(data.purchaseOrderModified || {}),
      purchaseOrderItemModifiedAll: PurchaseOrderItem.fromList(
        data.purchaseOrderItemModifiedAll || [],
      ),
    }
  }

  static async returnProductAll(props: { purchaseOrderId: string }) {
    const { purchaseOrderId } = props
    const response = await AxiosInstance.post(
      `/purchase-order/${purchaseOrderId}/return-product-all`,
    )
    const { data } = response.data as FullResponse<{ purchaseOrderModified: any }>
    return {
      purchaseOrderModified: PurchaseOrder.from(data.purchaseOrderModified || {}),
    }
  }

  static async close(props: { purchaseOrderId: string }) {
    const { purchaseOrderId } = props
    const response = await AxiosInstance.post(`/purchase-order/${purchaseOrderId}/close`)
    const { data } = response.data as FullResponse<{
      purchaseOrderModified: any
    }>
    return {
      purchaseOrderModified: PurchaseOrder.from(data.purchaseOrderModified),
    }
  }

  static async reopen(props: { purchaseOrderId: string }) {
    const { purchaseOrderId } = props
    const response = await AxiosInstance.post(`/purchase-order/${purchaseOrderId}/reopen`)
    const { data } = response.data as FullResponse<{
      purchaseOrderModified: any
    }>
    return {
      purchaseOrderModified: PurchaseOrder.from(data.purchaseOrderModified),
    }
  }

  static async terminate(props: { purchaseOrderId: string; walletId: string; note: string }) {
    const { purchaseOrderId, walletId, note } = props
    const response = await AxiosInstance.post(`/purchase-order/${purchaseOrderId}/terminate`, {
      walletId,
      note,
    })
    const { data } = response.data as FullResponse<{
      purchaseOrderModified: any
      distributorModified: any
    }>
    return {
      purchaseOrderModified: PurchaseOrder.from(data.purchaseOrderModified),
    }
  }

  static async destroy(purchaseOrderId: string) {
    const response = await AxiosInstance.post(`/purchase-order/${purchaseOrderId}/destroy`)
    const { data } = response.data as FullResponse<{ purchaseOrderDestroyed: any }>
    return data
  }
}
