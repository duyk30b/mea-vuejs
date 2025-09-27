import { AxiosInstance } from '../../../core/axios.instance'
import type { BaseResponse } from '../../_base/base-dto'
import { PurchaseOrder } from '../purchase-order.model'

export class PurchaseOrderReceptionApi {
  static async createDraft(purchaseOrder: PurchaseOrder) {
    const response = await AxiosInstance.post('/purchase-order/create-draft', {
      distributorId: purchaseOrder.distributorId,
      purchaseOrder: {
        startedAt: purchaseOrder.startedAt,
        itemsActualMoney: purchaseOrder.itemsActualMoney,
        discountMoney: purchaseOrder.discountMoney,
        discountPercent: purchaseOrder.discountPercent,
        discountType: purchaseOrder.discountType,
        surcharge: purchaseOrder.surcharge,
        totalMoney: purchaseOrder.totalMoney,
        note: purchaseOrder.note,
      },
      purchaseOrderItemList: (purchaseOrder.purchaseOrderItemList || []).map((i) => ({
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
    const { data } = response.data as BaseResponse<{ purchaseOrderId: string }>
    return data
  }

  static async updateDraft(purchaseOrderId: string, purchaseOrder: PurchaseOrder) {
    const response = await AxiosInstance.patch(`/purchase-order/${purchaseOrderId}/update-draft`, {
      distributorId: purchaseOrder.distributorId, // sửa thì không cho thay đổi distributor
      purchaseOrder: {
        startedAt: purchaseOrder.startedAt,
        itemsActualMoney: purchaseOrder.itemsActualMoney,
        discountMoney: purchaseOrder.discountMoney,
        discountPercent: purchaseOrder.discountPercent,
        discountType: purchaseOrder.discountType,
        surcharge: purchaseOrder.surcharge,
        totalMoney: purchaseOrder.totalMoney,
        note: purchaseOrder.note,
      },
      purchaseOrderItemList: (purchaseOrder.purchaseOrderItemList || []).map((i) => ({
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
    const { data } = response.data as BaseResponse<{ purchaseOrderId: string }>
    return data
  }

  static async depositedUpdate(purchaseOrderId: string, purchaseOrder: PurchaseOrder) {
    const response = await AxiosInstance.patch(`/purchase-order/${purchaseOrderId}/deposited-update`, {
      distributorId: purchaseOrder.distributorId, // sửa thì không cho thay đổi distributor
      purchaseOrder: {
        startedAt: purchaseOrder.startedAt,
        itemsActualMoney: purchaseOrder.itemsActualMoney,
        discountMoney: purchaseOrder.discountMoney,
        discountPercent: purchaseOrder.discountPercent,
        discountType: purchaseOrder.discountType,
        surcharge: purchaseOrder.surcharge,
        totalMoney: purchaseOrder.totalMoney,
        note: purchaseOrder.note,
      },
      purchaseOrderItemList: (purchaseOrder.purchaseOrderItemList || []).map((i) => ({
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
    const { data } = response.data as BaseResponse<{ purchaseOrderId: string }>
    return data
  }
}
