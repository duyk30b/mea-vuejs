import { ref } from 'vue'
import { Ticket } from '../../modules/ticket'

export const ticketClinicRef = ref<Ticket>(Ticket.blank())
export const ticketClinicList = ref<Ticket[]>([])
