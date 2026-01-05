import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import { PurchaseOrder } from '../purchase-order.model'

export class PurchaseOrderReceptionApi {
  static generatePurchaseOrderBasic(purchaseOrder: PurchaseOrder) {
    return {
      purchaseOrderBasic: {
        startedAt: purchaseOrder.startedAt,
        itemsActualMoney: purchaseOrder.itemsActualMoney,
        discountMoney: purchaseOrder.discountMoney,
        discountPercent: purchaseOrder.discountPercent,
        discountType: purchaseOrder.discountType,
        surcharge: purchaseOrder.surcharge,
        totalMoney: purchaseOrder.totalMoney,
        note: purchaseOrder.note,
      },
      purchaseOrderItemList: (purchaseOrder.purchaseOrderItemList || []).map((i, index) => ({
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
    }
  }

  static async draftInsert(purchaseOrder: PurchaseOrder) {
    const purchaseOrderBasicBody =
      PurchaseOrderReceptionApi.generatePurchaseOrderBasic(purchaseOrder)

    const response = await AxiosInstance.post('/purchase-order/draft-insert', {
      ...purchaseOrderBasicBody,
      distributorId: purchaseOrder.distributorId,
    })
    const { data } = response.data as BaseResponse<{ purchaseOrderCreated: any }>
    return {
      purchaseOrderCreated: PurchaseOrder.from(data.purchaseOrderCreated),
    }
  }

  static async draftUpdate(purchaseOrderId: string, purchaseOrder: PurchaseOrder) {
    const purchaseOrderBasicBody =
      PurchaseOrderReceptionApi.generatePurchaseOrderBasic(purchaseOrder)

    const response = await AxiosInstance.post(`/purchase-order/${purchaseOrderId}/draft-update`, {
      ...purchaseOrderBasicBody,
    })
    const { data } = response.data as BaseResponse<{ purchaseOrderModified: object }>
    return data
  }

  static async depositedUpdate(purchaseOrderId: string, purchaseOrder: PurchaseOrder) {
    const purchaseOrderBasicBody =
      PurchaseOrderReceptionApi.generatePurchaseOrderBasic(purchaseOrder)

    const response = await AxiosInstance.post(
      `/purchase-order/${purchaseOrderId}/deposited-update`,
      {
        ...purchaseOrderBasicBody,
      },
    )
    const { data } = response.data as BaseResponse<{ purchaseOrderModified: object }>
    return data
  }
}
