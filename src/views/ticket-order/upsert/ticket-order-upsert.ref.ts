import { ref, watchEffect } from 'vue'
import { DiscountType } from '../../../modules/enum'
import { Ticket } from '../../../modules/ticket'

export const ticket = ref<Ticket>(Ticket.blank())

watchEffect(() => {
  let itemsCostAmount = 0
  let productMoney = 0
  let procedureMoney = 0
  let itemsDiscount = 0

  ticket.value.ticketProductList?.forEach((item) => {
    itemsCostAmount += item.batch!.costPrice * item.quantity
    productMoney += item.actualPrice * item.quantity
    itemsDiscount += item.discountMoney * item.quantity
  })
  ticket.value.ticketProcedureList?.forEach((item) => {
    procedureMoney += item.actualPrice * item.quantity
    itemsDiscount += item.discountMoney * item.quantity
  })

  const itemsActualMoney = productMoney + procedureMoney

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
  const profit = totalMoney - itemsCostAmount - expense

  ticket.value.itemsCostAmount = itemsCostAmount
  ticket.value.productMoney = productMoney
  ticket.value.procedureMoney = procedureMoney
  ticket.value.itemsActualMoney = itemsActualMoney
  ticket.value.itemsDiscount = itemsDiscount

  ticket.value.discountMoney = discountMoney
  ticket.value.discountPercent = discountPercent
  ticket.value.discountType = discountType

  ticket.value.totalMoney = totalMoney
  ticket.value.profit = profit
  // ticket.value.paid = ...
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
