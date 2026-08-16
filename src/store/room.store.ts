import { Room } from '@/modules/room'
import { Ticket } from '@/modules/ticket'
import { ref } from 'vue'

export const roomTicketData = ref<
  Record<
    string, // {roomId: ...}
    {
      roomId: number
      room: Room
      paginationTime: string
      paginationData: Ticket[]
    }
  >
>({})

export const roomFinanceData = ref<
  Record<
    string, // {roomId: ...}
    {
      roomId: number
      room: Room
      paginationTime: string
      paginationData: Ticket[]
    }
  >
>({})

export const roomRadiology = ref<
  Record<
    string, // {roomId: ...}
    {
      roomId: number
      room: Room
      paginationTime: string
    }
  >
>({})
export const roomLaboratory = ref<
  Record<
    string, // {roomId: ...}
    {
      roomId: number
      room: Room
      paginationTime: string
    }
  >
>({})

export const ticketRef = ref<Ticket>(Ticket.blank())
export const roomRef = ref<Room>(new Room())

