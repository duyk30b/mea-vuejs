<script setup lang="ts">
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import { TicketType, type Ticket } from '../../../modules/ticket'
import TicketClinicStatusTag from '../../ticket-clinic/TicketClinicStatusTag.vue'
import TicketOrderStatusTag from '../../ticket-order/TicketOrderStatusTag.vue'

const props = defineProps<{ ticket?: Ticket; ticketId?: number }>()

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
  <div v-if="!ticket" style="font-size: 0.8rem">
    <a-tag color="default">
      <template #icon>
        <ExclamationCircleOutlined />
      </template>
      T{{ ticketId }} - Bị xóa
    </a-tag>
  </div>
  <div v-else-if="ticket!.ticketType === TicketType.Order" style="font-size: 0.8rem">
    <a style="margin-right: 0.5em" @click="openBlankTicketOrderDetail(ticket.id)">
      BH{{ ticket.id }}
    </a>
    <TicketOrderStatusTag :ticketStatus="ticket!.ticketStatus" />
  </div>
  <div v-else style="font-size: 0.8rem">
    <a style="margin-right: 0.5em" @click="openBlankTicketClinicDetail(ticket.id)">
      KB{{ ticket.id }}
    </a>
    <TicketClinicStatusTag :ticketStatus="ticket!.ticketStatus" />
  </div>
</template>
