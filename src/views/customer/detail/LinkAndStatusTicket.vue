<script setup lang="ts">
import { useRouter } from 'vue-router'
import { VoucherType } from '../../../modules/enum'
import type { Ticket } from '../../../modules/ticket'
import TicketClinicStatusTag from '../../ticket-clinic/TicketClinicStatusTag.vue'
import TicketEyeStatusTag from '../../ticket-eye/TicketEyeStatusTag.vue'
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

const openBlankTicketEyeDetail = async (ticketId: number) => {
  let route = router.resolve({
    name: 'TicketEyeSummary',
    params: { id: ticketId },
  })
  window.open(route.href, '_blank')
}
</script>

<template>
  <div v-if="ticket!.voucherType === VoucherType.Order" style="font-size: 0.8rem">
    <a style="margin-right: 0.5em" @click="openBlankTicketOrderDetail(ticket.id)">
      BH{{ ticket.id }}
    </a>
    <TicketOrderStatusTag :ticketStatus="ticket!.ticketStatus" />
  </div>
  <div v-if="ticket!.voucherType === VoucherType.Clinic" style="font-size: 0.8rem">
    <a style="margin-right: 0.5em" @click="openBlankTicketClinicDetail(ticket.id)">
      KB{{ ticket.id }}
    </a>
    <TicketClinicStatusTag :ticketStatus="ticket!.ticketStatus" />
  </div>
  <div v-if="ticket!.voucherType === VoucherType.Eye" style="font-size: 0.8rem">
    <a style="margin-right: 0.5em" @click="openBlankTicketEyeDetail(ticket.id)">
      KM{{ ticket.id }}
    </a>
    <TicketEyeStatusTag :ticketStatus="ticket!.ticketStatus" />
  </div>
</template>
