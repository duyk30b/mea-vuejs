import { ref, watchEffect } from 'vue'
import { DiscountType } from '../../../modules/enum'
import { Ticket } from '../../../modules/ticket'

export const ticket = ref<Ticket>(Ticket.blank())

watchEffect(() => {
  const totalCostAmount = ticket.value.ticketProductList!.reduce((acc, item) => {
    // let itemCostAmount = 0
    // if (item.batchId) {
    //   itemCostAmount = item.quantity * item.batch!.costPrice
    // } else if (item.product!.quantity <= 0) {
    //   itemCostAmount = (item.product?.costPrice || 0) * item.quantity
    // } else {
    //   itemCostAmount = (item.product!.costAmount * item.quantity) / item.product!.quantity
    // }
    // const itemCostAmountFix = Math.floor(itemCostAmount / 10) * 10
    // item.costAmount = itemCostAmountFix
    return acc + item.costAmount
  }, 0)

  const productsMoney = ticket.value.ticketProductList!.reduce((acc, item) => {
    return acc + item.actualPrice * item.quantity
  }, 0)
  const proceduresMoney = ticket.value.ticketProcedureList!.reduce((acc, item) => {
    return acc + item.actualPrice * item.quantity
  }, 0)
  const paraclinicalMoney = (ticket.value.ticketParaclinicalList || []).reduce((acc, item) => {
    return acc + item.actualPrice
  }, 0)

  const itemsActualMoney = productsMoney + proceduresMoney + paraclinicalMoney

  let discountMoney = 0
  let discountPercent = 0
  let discountType: DiscountType = DiscountType.VND
  if (ticket.value.discountType === DiscountType.VND) {
    discountMoney = ticket.value.discountMoney || 0
    discountPercent =
      itemsActualMoney == 0 ? 0 : Math.floor((discountMoney * 100) / itemsActualMoney)
    discountType = DiscountType.VND
  }
  if (ticket.value.discountType === DiscountType.Percent) {
    discountPercent = ticket.value.discountPercent || 0
    discountMoney = Math.floor((itemsActualMoney * discountPercent) / 100)
    discountType = DiscountType.Percent
  }

  const surcharge = ticket.value.surcharge || 0
  const expense = ticket.value.expense || 0
  const totalMoney = itemsActualMoney - discountMoney + surcharge
  const profit = totalMoney - totalCostAmount - expense

  ticket.value.totalCostAmount = totalCostAmount
  ticket.value.productsMoney = productsMoney
  ticket.value.proceduresMoney = proceduresMoney
  ticket.value.paraclinicalMoney = paraclinicalMoney
  ticket.value.discountMoney = discountMoney
  ticket.value.discountPercent = discountPercent
  ticket.value.discountType = discountType
  ticket.value.totalMoney = totalMoney
  ticket.value.profit = profit
  // ticket.value.paid =
  ticket.value.debt = totalMoney - ticket.value.paid
})

export enum ETicketOrderUpsertMode {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  COPY = 'COPY',
}

export enum ETicketOrderSave {
  CREATE_DRAFT = 'CREATE_DRAFT',
  UPDATE_DRAFT_APPROVED = 'UPDATE_DRAFT_APPROVED',
  CREATE_DEBT_SUCCESS = 'CREATE_DEBT_SUCCESS',
  UPDATE_DEBT_SUCCESS = 'UPDATE_DEBT_SUCCESS',
}
