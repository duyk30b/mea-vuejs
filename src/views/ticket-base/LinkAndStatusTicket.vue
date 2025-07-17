<script setup lang="ts">
import { useRouter } from 'vue-router'
import VueTag from '../../common/VueTag.vue'
import { Ticket, TicketType } from '../../modules/ticket'
import TicketStatusTag from './TicketStatusTag.vue'

const props = withDefaults(
  defineProps<{
    ticket?: Ticket
    ticketId?: number
    link?: boolean
    status?: boolean
  }>(),
  {
    ticket: () => Ticket.blank(),
    ticketId: 0,
    link: true,
    status: true,
  },
)
const router = useRouter()

const openBlankTicketOrderDetail = async (ticketId: number) => {
  const route = router.resolve({
    name: 'TicketOrderDetail',
    params: { id: ticketId },
  })
  window.open(route.href, '_blank')
}

const openBlankTicketClinicDetail = async (ticket: Ticket) => {
  const route = router.resolve({
    name: 'TicketClinicSummary',
    params: { ticketId: ticket.id, roomId: ticket.roomId },
  })
  window.open(route.href, '_blank')
}
</script>

<template>
  <template v-if="!ticket">
    <div v-if="!ticketId" style="font-size: 0.8rem"></div>
    <div v-else style="font-size: 0.8rem">
      <VueTag icon="exclamation">T{{ ticketId }} - Bị xóa</VueTag>
    </div>
  </template>
  <template v-else>
    <div v-if="ticket?.ticketType === TicketType.Order" style="font-size: 0.8rem">
      <a v-if="link" style="margin-right: 0.5em" @click="openBlankTicketOrderDetail(ticket.id)">
        BH{{ ticket.id }}
      </a>
      <TicketStatusTag v-if="status" :ticket="ticket" />
    </div>
    <div v-else style="font-size: 0.8rem">
      <a v-if="link" style="margin-right: 0.5em" @click="openBlankTicketClinicDetail(ticket)">
        KB{{ ticket.id }}
      </a>
      <TicketStatusTag v-if="status" :ticket="ticket" />
    </div>
  </template>
</template>
