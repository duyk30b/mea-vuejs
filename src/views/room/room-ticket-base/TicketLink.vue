<script setup lang="ts">
import { RoomService, RoomTicketStyle } from '@/modules/room'
import { Ticket } from '@/modules/ticket'
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{ ticket?: Ticket | undefined; ticketId: string; target?: '_blank' | '_self' }>(),
  {
    ticket: () => Ticket.blank(),
    ticketId: '0',
    target: '_self',
  },
)

const router = useRouter()
const roomMap = RoomService.roomMap

const openLinkBlankTicketOrderDetail = async (ticket: Ticket) => {
  const route = router.resolve({
    name: 'TicketOrderDetailContainer',
    params: { ticketId: ticket.id, roomId: ticket.roomId },
  })
  window.open(route.href, '_blank')
}

const openLinkBlankTicketClinicDetail = async (ticket: Ticket) => {
  const route = router.resolve({
    name: 'TicketClinicSummaryContainer',
    params: { ticketId: ticket.id, roomId: ticket.roomId },
  })
  window.open(route.href, '_blank')
}
</script>

<template>
  <span v-if="!ticket?.id || ticket.id === '0'" style="color: #555; font-weight: bold">
    T{{ ticketId.slice(0, 8) }}
  </span>
  <template v-else-if="props.target === '_self'">
    <span v-if="roomMap[ticket.roomId]?.roomStyle === RoomTicketStyle.TicketOrder">
      <router-link
        :to="{
          name: 'TicketOrderDetailContainer',
          params: { roomId: ticket.roomId, ticketId: ticket.id },
        }"
      >
        BH_{{ ticket.id.slice(-10) }}
      </router-link>
    </span>
    <span v-else>
      <router-link
        :to="{
          name: 'TicketClinicDetailContainer',
          params: { roomId: ticket.roomId, ticketId: ticket.id },
        }"
      >
        PK_{{ ticket.id.slice(-10) }}
      </router-link>
    </span>
  </template>
  <template v-else-if="props.target === '_blank'">
    <span v-if="roomMap[ticket.roomId]?.roomStyle === RoomTicketStyle.TicketOrder">
      <a @click="openLinkBlankTicketOrderDetail(ticket)">BH_{{ ticket.id.slice(-10) }}</a>
    </span>
    <span v-else>
      <a @click="openLinkBlankTicketClinicDetail(ticket)">PK_{{ ticket.id.slice(-10) }}</a>
    </span>
  </template>
</template>
