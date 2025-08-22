<script setup lang="ts">
import { RoomService, RoomTicketStyle } from '@/modules/room'
import { Ticket } from '@/modules/ticket'

const props = withDefaults(defineProps<{ ticket: Ticket }>(), {
  ticket: () => Ticket.blank(),
})

const roomMap = RoomService.roomMap
</script>

<template>
  <template v-if="roomMap[ticket.roomId]?.roomStyle === RoomTicketStyle.TicketOrder">
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
  </template>
  <template v-else-if="roomMap[ticket.roomId]?.roomStyle === RoomTicketStyle.TicketSpa">
    <router-link
      :to="{
        name: 'TicketSpaDetailContainer',
        params: { roomId: ticket.roomId, ticketId: ticket.id },
      }"
    >
      SP_{{
        ticket.year?.toString().slice(-2) +
        ticket.month?.toString().padStart(2, '0') +
        ticket.date?.toString().padStart(2, '0') +
        '_' +
        ticket.dailyIndex?.toString().padStart(2, '0')
      }}
    </router-link>
  </template>
  <template v-else>
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
  </template>
</template>
