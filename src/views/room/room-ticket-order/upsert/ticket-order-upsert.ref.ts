import { DiscountType } from '@/modules/enum'
import { Ticket } from '@/modules/ticket'
import { ref, watchEffect } from 'vue'

export const ticketOrderUpsertRef = ref<Ticket>(Ticket.blank())

watchEffect(() => {
  let productMoney = 0
  let procedureMoney = 0
  let itemsDiscount = 0

  ticketOrderUpsertRef.value.ticketProductList?.forEach((item) => {
    productMoney += item.actualPrice * item.quantity
    itemsDiscount += item.discountMoney * item.quantity
  })
  ticketOrderUpsertRef.value.ticketProcedureList?.forEach((item) => {
    procedureMoney += item.actualPrice * item.quantity
    itemsDiscount += item.discountMoney * item.quantity
  })

  const itemsActualMoney = productMoney + procedureMoney

  let discountMoney = 0
  let discountPercent = 0
  let discountType: DiscountType = DiscountType.VND
  if (ticketOrderUpsertRef.value.discountType === DiscountType.VND) {
    discountMoney = ticketOrderUpsertRef.value.discountMoney || 0
    discountPercent =
      itemsActualMoney == 0 ? 0 : Math.floor((discountMoney * 100) / itemsActualMoney)
    discountType = DiscountType.VND
  }
  if (ticketOrderUpsertRef.value.discountType === DiscountType.Percent) {
    discountPercent = ticketOrderUpsertRef.value.discountPercent || 0
    discountMoney = Math.floor((itemsActualMoney * discountPercent) / 100)
    discountType = DiscountType.Percent
  }

  const surcharge =
    ticketOrderUpsertRef.value.ticketSurchargeList?.reduce((acc, item) => {
      return acc + item.money
    }, 0) || 0
  const expense =
    ticketOrderUpsertRef.value.ticketExpenseList?.reduce((acc, item) => {
      return acc + item.money
    }, 0) || 0

  const totalMoney = itemsActualMoney - discountMoney + surcharge

  ticketOrderUpsertRef.value.productMoney = productMoney
  ticketOrderUpsertRef.value.procedureMoney = procedureMoney
  ticketOrderUpsertRef.value.itemsActualMoney = itemsActualMoney
  ticketOrderUpsertRef.value.itemsDiscount = itemsDiscount

  ticketOrderUpsertRef.value.discountMoney = discountMoney
  ticketOrderUpsertRef.value.discountPercent = discountPercent
  ticketOrderUpsertRef.value.discountType = discountType

  ticketOrderUpsertRef.value.surcharge = surcharge
  ticketOrderUpsertRef.value.expense = expense

  ticketOrderUpsertRef.value.totalMoney = totalMoney
  // ticketOrderUpsertRef.value.profit = 0
  // ticketOrderUpsertRef.value.paid = ...
  // ticketOrderUpsertRef.value.debt = totalMoney - ticketOrderUpsertRef.value.paid
})

export enum ETicketOrderUpsertMode {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  COPY = 'COPY',
}

export enum ETicketOrderSave {
  CREATE_DRAFT = 'CREATE_DRAFT',
  UPDATE_DRAFT = 'UPDATE_DRAFT',
  UPDATE_DEPOSITED = 'UPDATE_DEPOSITED',
  CREATE_DEBT_SUCCESS = 'CREATE_DEBT_SUCCESS',
  UPDATE_DEBT_SUCCESS = 'UPDATE_DEBT_SUCCESS',
}
