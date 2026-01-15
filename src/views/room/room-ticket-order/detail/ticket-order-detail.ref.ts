import { Ticket } from '@/modules/ticket'
import { ref, watchEffect } from 'vue'

export const ticketOrderDetailRef = ref<Ticket>(Ticket.blank())

watchEffect(() => {
  let itemsDiscountProduct = 0
  let itemsDiscountProcedure = 0

  ticketOrderDetailRef.value.ticketProductList?.forEach((item) => {
    itemsDiscountProduct += item.unitDiscountMoney * item.unitQuantity
  })
  ticketOrderDetailRef.value.ticketProcedureList?.forEach((item) => {
    itemsDiscountProcedure += item.discountMoney * item.quantity
  })

  ticketOrderDetailRef.value.itemsDiscountProcedure = itemsDiscountProcedure
  ticketOrderDetailRef.value.itemsDiscountProduct = itemsDiscountProduct
})
