import { ref } from 'vue'
import { Ticket } from '../../../modules/ticket'

const ticketClinic = ref<Ticket>(Ticket.blank())
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

export { ticketClinic }
