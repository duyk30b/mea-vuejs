<script setup lang="ts">
import VueTag from '@/common/VueTag.vue'
import { RoomService, RoomTicketStyle } from '@/modules/room'
import { Ticket } from '@/modules/ticket'
import { useRouter } from 'vue-router'
import TicketStatusTag from './TicketStatusTag.vue'
import TicketClinicSummaryContainer from '../room-ticket-clinic/detail/summary/TicketClinicSummaryContainer.vue'

const props = withDefaults(
  defineProps<{
    ticket?: Ticket
    ticketId?: string
    link?: boolean
    status?: boolean
  }>(),
  {
    ticket: () => Ticket.blank(),
    ticketId: '',
    link: true,
    status: true,
  },
)
const router = useRouter()

const roomMap = RoomService.roomMap

const openBlankTicketOrderDetail = async (ticket: Ticket) => {
  const route = router.resolve({
    name: 'TicketOrderDetailContainer',
    params: { ticketId: ticket.id, roomId: ticket.roomId },
  })
  window.open(route.href, '_blank')
}

const openBlankTicketClinicDetail = async (ticket: Ticket) => {
  const route = router.resolve({
    name: 'TicketClinicSummaryContainer',
    params: { ticketId: ticket.id, roomId: ticket.roomId },
  })
  window.open(route.href, '_blank')
}
</script>

<template>
  <template v-if="!ticket">
    <VueTag icon="exclamation">T{{ ticketId || 0 }} - Bị xóa</VueTag>
  </template>
  <template v-else>
    <div v-if="roomMap[ticket.roomId]?.roomStyle === RoomTicketStyle.TicketOrder" style="">
      <a v-if="link" style="margin-right: 0.5em" @click="openBlankTicketOrderDetail(ticket)">
        BH{{ ticket.id }}
      </a>
      <TicketStatusTag v-if="status" :ticket="ticket" />
    </div>
    <div v-else style="">
      <a v-if="link" style="margin-right: 0.5em" @click="openBlankTicketClinicDetail(ticket)">
        KB{{ ticket.id }}
      </a>
      <TicketStatusTag v-if="status" :ticket="ticket" />
    </div>
  </template>
</template>
