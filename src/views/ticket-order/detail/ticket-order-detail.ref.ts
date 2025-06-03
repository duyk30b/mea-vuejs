import { ref, watchEffect } from 'vue'
import { Ticket } from '../../../modules/ticket'

export const ticketOrderDetailRef = ref<Ticket>(Ticket.blank())

watchEffect(() => {
  let itemsDiscountProduct = 0
  let itemsDiscountProcedure = 0

  ticketOrderDetailRef.value.ticketProductList?.forEach((item) => {
    itemsDiscountProduct += item.discountMoney * item.quantity
  })
  ticketOrderDetailRef.value.ticketProcedureList?.forEach((item) => {
    itemsDiscountProcedure += item.discountMoney * item.quantity
  })

  ticketOrderDetailRef.value.itemsDiscountProcedure = itemsDiscountProcedure
  ticketOrderDetailRef.value.itemsDiscountProduct = itemsDiscountProduct
})
