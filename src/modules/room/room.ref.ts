import { ref } from 'vue'
import { Ticket } from '../ticket'

export const roomTicketMapRoomId = ref<
  Record<string, { paginationTime: string; paginationData: Ticket[] }>
>({}) // {roomId: ...}

export const roomDeliveryPagination = ref<Ticket[]>([])
export const roomFinancePagination = ref<Ticket[]>([])

export const ticketRoomRef = ref<Ticket>(Ticket.blank())

export const roomRadiology = ref<Record<string, string>>({})
export const roomLaboratory = ref<Record<string, string>>({})
