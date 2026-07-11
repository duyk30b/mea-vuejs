import { Room } from '@/modules/room'
import { RoomService } from '@/modules/room'
import { Ticket } from '@/modules/ticket'
import { defineStore } from 'pinia'

export const useTicketOrderDetailStore = defineStore('ticket-order-detail-store', {
  state: () => {
    return {
      roomRef: Room.blank(),
      ticketRef: Ticket.blank(),
    }
  },
  getters: {},
  actions: {
    async fetchRoom(roomId: number) {
      const room = await RoomService.detail(roomId)
      this.roomRef = room
    },
    async updateRoomSetting(roomSetting: string) {
      const room = await RoomService.updateRoomSetting(this.roomRef.id, roomSetting)
      this.roomRef = room
    }
  },
})
