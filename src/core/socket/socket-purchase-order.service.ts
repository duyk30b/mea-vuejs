import { PaymentPurchaseOrder } from '@/modules/payment-purchase-order'
import { PurchaseOrder } from '@/modules/purchase-order'
import { PurchaseOrderItem, PurchaseOrderItemService } from '@/modules/purchase-order-item'
import { purchaseOrderDetailRef, purchaseOrderPaginationChange } from '@/store/purchase-order.store'

export class SocketPurchaseOrderService {
  static async listenSocketPurchaseOrderPaginationChange(data: {
    purchaseOrderCreated?: PurchaseOrder
    purchaseOrderDestroyed?: PurchaseOrder
  }) {
    purchaseOrderPaginationChange.time = new Date().toISOString()
  }

  static async listenSocketPurchaseOrderChange(data: {
    purchaseOrderId: string
    purchaseOrderModified?: PurchaseOrder
    purchaseOrderItem?: {
      destroyedList?: PurchaseOrderItem[]
      upsertedList?: PurchaseOrderItem[]
    }
    paymentPurchaseOrderCreatedList?: PaymentPurchaseOrder[]
  }) {
    if (data.purchaseOrderModified) {
      purchaseOrderPaginationChange.purchaseOrderModified = PurchaseOrder.from(
        data.purchaseOrderModified,
      )
    }

    if (purchaseOrderDetailRef.value.id !== data.purchaseOrderId) {
      return
    }

    if (!purchaseOrderDetailRef.value.purchaseOrderItemList) {
      purchaseOrderDetailRef.value.purchaseOrderItemList = []
    }
    if (!purchaseOrderDetailRef.value.paymentPurchaseOrderList) {
      purchaseOrderDetailRef.value.paymentPurchaseOrderList = []
    }

    if (data.purchaseOrderModified) {
      Object.assign(purchaseOrderDetailRef.value, PurchaseOrder.from(data.purchaseOrderModified))
    }

    if (data.purchaseOrderItem?.destroyedList?.length) {
      const idDestroyList = data.purchaseOrderItem.destroyedList.map((i) => i.id)
      purchaseOrderDetailRef.value.purchaseOrderItemList =
        purchaseOrderDetailRef.value.purchaseOrderItemList.filter((i) => {
          return !idDestroyList.includes(i.id)
        })
    }
    if (data.purchaseOrderItem?.upsertedList?.length) {
      data.purchaseOrderItem.upsertedList.forEach((i) => {
        const temp = PurchaseOrderItem.from(i)
        const trFind = purchaseOrderDetailRef.value.purchaseOrderItemList!.find((j) => {
          return i.id === j.id
        })
        if (trFind) {
          Object.assign(trFind, temp)
        } else {
          purchaseOrderDetailRef.value.purchaseOrderItemList!.push(temp)
        }
      })
      purchaseOrderDetailRef.value.purchaseOrderItemList!.sort((a, b) => (a.id < b.id ? -1 : 1))
    }

    if (data.paymentPurchaseOrderCreatedList?.length) {
      data.paymentPurchaseOrderCreatedList.forEach((i) => {
        const temp = PaymentPurchaseOrder.from(i)
        purchaseOrderDetailRef.value.paymentPurchaseOrderList!.push(temp)
      })
    }

    await PurchaseOrderItemService.refreshRelation(
      purchaseOrderDetailRef.value.purchaseOrderItemList!,
    )
  }
}
