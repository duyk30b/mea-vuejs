import { ref, watchEffect } from 'vue'
import { DiscountType } from '../../../modules/enum'
import { Invoice } from '../../../modules/invoice'

const invoice = ref<Invoice>(Invoice.blank())

watchEffect(() => {
  const itemsCostMoney = invoice.value.invoiceItems!.reduce((acc, item) => {
    let itemCost = 0
    if (item.batchId && item.batch!.quantity !== 0) {
      itemCost = (item.batch!.costAmount / item.batch!.quantity) * item.quantity
    }
    if (!item.batchId && item.productId && item.product!.quantity !== 0) {
      itemCost = (item.product!.costAmount / item.product!.quantity) * item.quantity
    }
    const itemCostAmount = Math.floor(itemCost / 100) * 100
    item.costAmount = itemCostAmount
    return acc + item.costAmount
  }, 0)
  const itemsActualMoney = invoice.value.invoiceItems!.reduce((acc, item) => {
    return acc + item.actualPrice * item.quantity
  }, 0)

  let discountMoney = 0
  let discountPercent = 0
  let discountType: DiscountType = DiscountType.VND
  if (invoice.value.discountType === DiscountType.VND) {
    discountMoney = invoice.value.discountMoney || 0
    discountPercent =
      itemsActualMoney == 0 ? 0 : Math.floor((discountMoney * 100) / itemsActualMoney)
    discountType = DiscountType.VND
  }
  if (invoice.value.discountType === DiscountType.Percent) {
    discountPercent = invoice.value.discountPercent || 0
    discountMoney = Math.floor((itemsActualMoney * discountPercent) / 100)
    discountType = DiscountType.Percent
  }

  const surcharge = invoice.value.surcharge || 0
  const expense = invoice.value.expense || 0
  const revenue = itemsActualMoney - discountMoney + surcharge
  const profit = revenue - itemsCostMoney - expense

  invoice.value.itemsCostMoney = itemsCostMoney
  invoice.value.itemsActualMoney = itemsActualMoney
  invoice.value.discountMoney = discountMoney
  invoice.value.discountPercent = discountPercent
  invoice.value.discountType = discountType
  invoice.value.revenue = revenue
  invoice.value.profit = profit
})

export { invoice }

export enum EInvoiceUpsertMode {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  COPY = 'COPY',
}

export enum EInvoiceSave {
  CREATE_DRAFT = 'CREATE_DRAFT',
  CREATE_BASIC_AND_NEW = 'CREATE_BASIC_AND_NEW',
  CREATE_BASIC_AND_DETAIL = 'CREATE_BASIC_AND_DETAIL',
  UPDATE_DRAFT = 'UPDATE_DRAFT',
  UPDATE_BASIC = 'UPDATE_BASIC',
}
