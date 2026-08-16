import { DiscountType } from '@/modules/enum'
import { PurchaseOrder } from '@/modules/purchase-order'
import { ref, watchEffect } from 'vue'

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

const purchaseOrderUpsertRef = ref<PurchaseOrder>(PurchaseOrder.blank())

export const warehouseIdForReceive = ref<number>(0)

watchEffect(() => {
  const itemsActualMoney = purchaseOrderUpsertRef.value.purchaseOrderItemList!.reduce((acc, item) => {
    return acc + Math.floor(item.unitCostPrice / item.unitRate) * item.quantity
  }, 0)

  let discountMoney = 0
  let discountPercent = 0
  let discountType: DiscountType = DiscountType.VND
  if (purchaseOrderUpsertRef.value.discountType === DiscountType.VND) {
    discountMoney = purchaseOrderUpsertRef.value.discountMoney || 0
    discountPercent =
      itemsActualMoney == 0 ? 0 : Math.floor((discountMoney * 100) / itemsActualMoney)
    discountType = DiscountType.VND
  }
  if (purchaseOrderUpsertRef.value.discountType === DiscountType.Percent) {
    discountPercent = purchaseOrderUpsertRef.value.discountPercent || 0
    discountMoney = Math.floor((itemsActualMoney * discountPercent) / 100)
    discountType = DiscountType.Percent
  }
  const surcharge = purchaseOrderUpsertRef.value.surcharge || 0
  const totalMoney = itemsActualMoney - discountMoney + surcharge

  purchaseOrderUpsertRef.value.itemsActualMoney = itemsActualMoney
  purchaseOrderUpsertRef.value.discountMoney = discountMoney
  purchaseOrderUpsertRef.value.discountPercent = discountPercent
  purchaseOrderUpsertRef.value.discountType = discountType
  purchaseOrderUpsertRef.value.surcharge = surcharge
  purchaseOrderUpsertRef.value.totalMoney = totalMoney
})

export { purchaseOrderUpsertRef }
