import { DiscountType } from '@/modules/enum'
import { Receipt } from '@/modules/receipt'
import { ref, watchEffect } from 'vue'

const receipt = ref<Receipt>(Receipt.blank())

watchEffect(() => {
  const itemsActualMoney = receipt.value.receiptItems.reduce(
    (acc, item) => acc + (item.productBatch?.costPrice || 0) * item.quantity,
    0
  )

  let discountMoney = 0
  let discountPercent = 0
  let discountType: DiscountType = DiscountType.VND
  if (receipt.value.discountType === DiscountType.VND) {
    discountMoney = receipt.value.discountMoney || 0
    discountPercent = itemsActualMoney == 0 ? 0 : Math.floor((discountMoney * 100) / itemsActualMoney)
    discountType = DiscountType.VND
  }
  if (receipt.value.discountType === DiscountType.Percent) {
    discountPercent = receipt.value.discountPercent || 0
    discountMoney = Math.floor((itemsActualMoney * discountPercent) / 100)
    discountType = DiscountType.Percent
  }
  const surcharge = receipt.value.surcharge || 0
  const revenue = itemsActualMoney - discountMoney + surcharge

  receipt.value.itemsActualMoney = itemsActualMoney
  receipt.value.discountMoney = discountMoney
  receipt.value.discountPercent = discountPercent
  receipt.value.discountType = discountType
  receipt.value.surcharge = surcharge
  receipt.value.revenue = revenue
})

export { receipt }
