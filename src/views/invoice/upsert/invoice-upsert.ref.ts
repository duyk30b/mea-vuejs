import { ref, watchEffect } from 'vue'
import { DiscountType } from '../../../modules/enum'
import { Invoice } from '../../../modules/invoice'

const invoice = ref<Invoice>(Invoice.blank())

watchEffect(() => {
  const totalCostAmount = invoice.value.invoiceItems!.reduce((acc, item) => {
    let itemCost = 0
    if (item.productId) {
      if (item.product!.quantity <= 0) {
        itemCost = (item.product?.costPrice || 0) * item.quantity
      } else {
        itemCost = (item.product!.costAmount * item.quantity) / item.product!.quantity
      }
    }
    const itemCostAmount = Math.floor(itemCost / 10) * 10
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
  const totalMoney = itemsActualMoney - discountMoney + surcharge
  const profit = totalMoney - totalCostAmount - expense

  invoice.value.totalCostAmount = totalCostAmount
  invoice.value.itemsActualMoney = itemsActualMoney
  invoice.value.discountMoney = discountMoney
  invoice.value.discountPercent = discountPercent
  invoice.value.discountType = discountType
  invoice.value.totalMoney = totalMoney
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
  CREATE_QUICK_AND_NEW = 'CREATE_QUICK_AND_NEW',
  CREATE_BASIC_AND_REDIRECT_DETAIL = 'CREATE_BASIC_AND_REDIRECT_DETAIL',
  UPDATE_INVOICE_DRAFT_AND_INVOICE_PREPAYMENT = 'UPDATE_INVOICE_DRAFT_AND_INVOICE_PREPAYMENT',
  UPDATE_INVOICE_DEBT_AND_INVOICE_SUCCESS = 'UPDATE_INVOICE_DEBT_AND_INVOICE_SUCCESS',
}
