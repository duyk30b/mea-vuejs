import { ref, watchEffect } from 'vue'
import { DiscountType } from '../../../modules/enum'
import { Receipt } from '../../../modules/receipt'

const receipt = ref<Receipt>(Receipt.blank())

watchEffect(() => {
  const itemsActualMoney = receipt.value.receiptItems!.reduce(
    (acc, item) => acc + item.costPrice * item.quantity,
    0
  )

  let discountMoney = 0
  let discountPercent = 0
  let discountType: DiscountType = DiscountType.VND
  if (receipt.value.discountType === DiscountType.VND) {
    discountMoney = receipt.value.discountMoney || 0
    discountPercent =
      itemsActualMoney == 0 ? 0 : Math.floor((discountMoney * 100) / itemsActualMoney)
    discountType = DiscountType.VND
  }
  if (receipt.value.discountType === DiscountType.Percent) {
    discountPercent = receipt.value.discountPercent || 0
    discountMoney = Math.floor((itemsActualMoney * discountPercent) / 100)
    discountType = DiscountType.Percent
  }
  const surcharge = receipt.value.surcharge || 0
  const totalMoney = itemsActualMoney - discountMoney + surcharge

  receipt.value.itemsActualMoney = itemsActualMoney
  receipt.value.discountMoney = discountMoney
  receipt.value.discountPercent = discountPercent
  receipt.value.discountType = discountType
  receipt.value.surcharge = surcharge
  receipt.value.totalMoney = totalMoney
})

export { receipt }

export enum EReceiptUpsertMode {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  COPY = 'COPY',
}

export enum EReceiptSave {
  CREATE_DRAFT = 'CREATE_DRAFT',
  CREATE_QUICK_AND_NEW = 'CREATE_QUICK_AND_NEW',
  CREATE_BASIC_AND_REDIRECT_DETAIL = 'CREATE_BASIC_AND_REDIRECT_DETAIL',
  UPDATE_RECEIPT_DRAFT_AND_RECEIPT_PREPAYMENT = 'UPDATE_RECEIPT_DRAFT_AND_RECEIPT_PREPAYMENT',
  UPDATE_RECEIPT_DEBT_AND_RECEIPT_SUCCESS = 'UPDATE_RECEIPT_DEBT_AND_RECEIPT_SUCCESS',
}
