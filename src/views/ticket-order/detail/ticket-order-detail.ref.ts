import { ref, watchEffect } from 'vue'
import { Ticket } from '../../../modules/ticket'

export const ticket = ref<Ticket>(Ticket.blank())

watchEffect(() => {
  let itemsDiscountProduct = 0
  let itemsDiscountProcedure = 0

  ticket.value.ticketProductList?.forEach((item) => {
    itemsDiscountProduct += item.discountMoney * item.quantity
  })
  ticket.value.ticketProcedureList?.forEach((item) => {
    itemsDiscountProcedure += item.discountMoney * item.quantity
  })

  ticket.value.itemsDiscountProcedure = itemsDiscountProcedure
  ticket.value.itemsDiscountProduct = itemsDiscountProduct
})

export enum PaymentViewType {
  Prepayment = 1,
  SendProductAndPaymentAndClose = 2,
  PaymentAndClose = 3,
  PayDebt = 4,
  RefundOverpaid = 5,
  Success = 6,
}
