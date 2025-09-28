<script setup lang="ts">
import { RoomService, RoomTicketStyle } from '@/modules/room'
import { Ticket } from '@/modules/ticket'

const props = withDefaults(defineProps<{ ticket?: Ticket | undefined; ticketId: string }>(), {
  ticket: () => Ticket.blank(),
  ticketId: '0',
})

const roomMap = RoomService.roomMap
</script>

<template>
  <span v-if="!ticket?.id" style="color: #555; font-weight: bold">T{{ ticketId.slice(0, 8) }}</span>
  <span v-else-if="roomMap[ticket.roomId]?.roomStyle === RoomTicketStyle.TicketOrder">
    <router-link
      :to="{
        name: 'TicketOrderDetailContainer',
        params: { roomId: ticket.roomId, ticketId: ticket.id },
      }"
    >
      BH_{{
        ticket.year?.toString().slice(-2) +
        ticket.month?.toString().padStart(2, '0') +
        ticket.date?.toString().padStart(2, '0') +
        '_' +
        ticket.dailyIndex?.toString().padStart(2, '0')
      }}
    </router-link>
  </span>
  <span v-else>
    <router-link
      :to="{
        name: 'TicketClinicDetailContainer',
        params: { roomId: ticket.roomId, ticketId: ticket.id },
      }"
    >
      PK_{{
        ticket.year?.toString().slice(-2) +
        ticket.month?.toString().padStart(2, '0') +
        ticket.date?.toString().padStart(2, '0') +
        '_' +
        ticket.dailyIndex?.toString().padStart(2, '0')
      }}
    </router-link>
  </span>
</template>
