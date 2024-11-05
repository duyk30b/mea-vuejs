import { ref } from 'vue'
import type { Ticket } from './ticket.model'

const ticketHistory = ref<Record<string, Ticket>>({})

export { ticketHistory }
