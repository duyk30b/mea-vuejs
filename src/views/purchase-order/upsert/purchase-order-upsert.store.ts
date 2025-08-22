import { ref, watchEffect } from 'vue'
import { DiscountType } from '../../../modules/enum'
import { PurchaseOrder } from '@/modules/purchase-order'

const purchaseOrder = ref<PurchaseOrder>(PurchaseOrder.blank())

export const warehouseId = ref<number>(0)

watchEffect(() => {
  const itemsActualMoney = purchaseOrder.value.purchaseOrderItemList!.reduce((acc, item) => {
    return acc + item.costPrice * item.quantity
  }, 0)

  let discountMoney = 0
  let discountPercent = 0
  let discountType: DiscountType = DiscountType.VND
  if (purchaseOrder.value.discountType === DiscountType.VND) {
    discountMoney = purchaseOrder.value.discountMoney || 0
    discountPercent =
      itemsActualMoney == 0 ? 0 : Math.floor((discountMoney * 100) / itemsActualMoney)
    discountType = DiscountType.VND
  }
  if (purchaseOrder.value.discountType === DiscountType.Percent) {
    discountPercent = purchaseOrder.value.discountPercent || 0
    discountMoney = Math.floor((itemsActualMoney * discountPercent) / 100)
    discountType = DiscountType.Percent
  }
  const surcharge = purchaseOrder.value.surcharge || 0
  const totalMoney = itemsActualMoney - discountMoney + surcharge

  purchaseOrder.value.itemsActualMoney = itemsActualMoney
  purchaseOrder.value.discountMoney = discountMoney
  purchaseOrder.value.discountPercent = discountPercent
  purchaseOrder.value.discountType = discountType
  purchaseOrder.value.surcharge = surcharge
  purchaseOrder.value.totalMoney = totalMoney
})

export { purchaseOrder }

export enum EPurchaseOrderUpsertMode {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  COPY = 'COPY',
}

export enum EPurchaseOrderSave {
  CREATE_DRAFT = 'CREATE_DRAFT',
  UPDATE_DRAFT = 'UPDATE_DRAFT',
  UPDATE_PREPAYMENT = 'UPDATE_PREPAYMENT',
}
