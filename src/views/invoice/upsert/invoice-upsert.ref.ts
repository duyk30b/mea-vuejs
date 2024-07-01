import { ref, watchEffect } from 'vue'
import { DiscountType } from '../../../modules/enum'
import { Invoice } from '../../../modules/invoice'
import { Visit } from '../../../modules/visit'

const invoice = ref<Invoice>(Invoice.blank())

export const visit = ref<Visit>(Visit.blank())

watchEffect(() => {
  const totalCostAmount = visit.value.visitProductList!.reduce((acc, item) => {
    let itemCostAmount = 0
    if (item.product!.quantity <= 0) {
      itemCostAmount = (item.product?.costPrice || 0) * item.quantity
    } else {
      itemCostAmount = (item.product!.costAmount * item.quantity) / item.product!.quantity
    }
    const itemCostAmountFix = Math.floor(itemCostAmount / 10) * 10
    item.costAmount = itemCostAmountFix
    return acc + item.costAmount
  }, 0)

  const productsMoney = visit.value.visitProductList!.reduce((acc, item) => {
    return acc + item.actualPrice * item.quantity
  }, 0)
  const proceduresMoney = visit.value.visitProcedureList!.reduce((acc, item) => {
    return acc + item.actualPrice * item.quantity
  }, 0)
  const radiologyMoney = (visit.value.visitRadiologyList || []).reduce((acc, item) => {
    return acc + item.actualPrice
  }, 0)

  const itemsActualMoney = productsMoney + proceduresMoney + radiologyMoney

  let discountMoney = 0
  let discountPercent = 0
  let discountType: DiscountType = DiscountType.VND
  if (visit.value.discountType === DiscountType.VND) {
    discountMoney = visit.value.discountMoney || 0
    discountPercent =
      itemsActualMoney == 0 ? 0 : Math.floor((discountMoney * 100) / itemsActualMoney)
    discountType = DiscountType.VND
  }
  if (visit.value.discountType === DiscountType.Percent) {
    discountPercent = visit.value.discountPercent || 0
    discountMoney = Math.floor((itemsActualMoney * discountPercent) / 100)
    discountType = DiscountType.Percent
  }

  const surcharge = visit.value.surcharge || 0
  const expense = visit.value.expense || 0
  const totalMoney = itemsActualMoney - discountMoney + surcharge
  const profit = totalMoney - totalCostAmount - expense

  visit.value.totalCostAmount = totalCostAmount
  visit.value.productsMoney = productsMoney
  visit.value.proceduresMoney = proceduresMoney
  visit.value.radiologyMoney = radiologyMoney
  visit.value.discountMoney = discountMoney
  visit.value.discountPercent = discountPercent
  visit.value.discountType = discountType
  visit.value.totalMoney = totalMoney
  visit.value.profit = profit
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
