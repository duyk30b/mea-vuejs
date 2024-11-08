<script setup lang="ts">
import { useRouter } from 'vue-router'
import { TicketType, type Ticket } from '../../../modules/ticket'
import TicketClinicStatusTag from '../../ticket-clinic/TicketClinicStatusTag.vue'
import TicketOrderStatusTag from '../../ticket-order/TicketOrderStatusTag.vue'

const props = defineProps<{ ticket: Ticket }>()

const router = useRouter()

const openBlankTicketOrderDetail = async (ticketId: number) => {
  let route = router.resolve({
    name: 'TicketOrderDetail',
    params: { id: ticketId },
  })
  window.open(route.href, '_blank')
}

const openBlankTicketClinicDetail = async (ticketId: number) => {
  let route = router.resolve({
    name: 'TicketClinicSummary',
    params: { id: ticketId },
  })
  window.open(route.href, '_blank')
}
</script>

<template>
  <div v-if="ticket!.ticketType === TicketType.Order" style="font-size: 0.8rem">
    <a style="margin-right: 0.5em" @click="openBlankTicketOrderDetail(ticket.id)">
      BH{{ ticket.id }}
    </a>
    <TicketOrderStatusTag :ticketStatus="ticket!.ticketStatus" />
  </div>
  <div
    v-if="[TicketType.Clinic, TicketType.Eye].includes(ticket!.ticketType)"
    style="font-size: 0.8rem">
    <a style="margin-right: 0.5em" @click="openBlankTicketClinicDetail(ticket.id)">
      KB{{ ticket.id }}
    </a>
    <TicketClinicStatusTag :ticketStatus="ticket!.ticketStatus" />
  </div>
</template>
