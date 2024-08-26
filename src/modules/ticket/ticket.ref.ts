import { ref } from 'vue'
import { Ticket } from './ticket.model'
import { VoucherType } from '../enum'

const ticketRef = ref<Ticket>(Ticket.blank())
// watchEffect(() => {
//   const proceduresMoney = (ticket.value.ticketProcedureList || []).reduce((acc, item) => {
//     return acc + item.quantity * item.actualPrice
//   }, 0)
//   const productsMoney = (ticket.value.ticketProductList || []).reduce((acc, item) => {
//     return acc + item.quantity * item.actualPrice
//   }, 0)

//   ticket.value.proceduresMoney = proceduresMoney
//   ticket.value.productsMoney = productsMoney
//   ticket.value.totalMoney = productsMoney + proceduresMoney
// })

const ticketPagination = ref({
  meta: {
    total: 0,
    limit: Number(localStorage.getItem('TICKET_PAGINATION_LIMIT')) || 10,
    page: 1,
    voucherType: VoucherType.Order,
  },
  data: <Ticket[]>[],
})

const ticketHistory = ref<Record<string, Ticket>>({})

export { ticketRef, ticketPagination, ticketHistory }
