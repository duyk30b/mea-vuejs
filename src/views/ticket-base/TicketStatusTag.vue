<script setup lang="ts">
import VueTag from '../../common/VueTag.vue'
import { Ticket, TicketStatus, TicketType } from '../../modules/ticket'

const props = withDefaults(defineProps<{ ticket?: Ticket | undefined }>(), { ticket: undefined })
</script>

<template>
  <VueTag v-if="!ticket" bg-color="red" icon="close">Bị xóa</VueTag>
  <VueTag v-else-if="ticket.ticketStatus === TicketStatus.Schedule" color="purple" icon="calendar">
    <span v-if="ticket.ticketType === TicketType.Order">Nháp</span>
    <span v-else>Hẹn khám</span>
  </VueTag>
  <VueTag v-else-if="ticket.ticketStatus === TicketStatus.Draft" color="orange" icon="exclamation">
    <span v-if="ticket.ticketType === TicketType.Order">Nháp</span>
    <span v-else>Chờ khám</span>
  </VueTag>
  <VueTag v-else-if="ticket.ticketStatus === TicketStatus.Deposited" color="blue" icon="clock">
    <span v-if="ticket.ticketType === TicketType.Order">Đặt hàng</span>
    <span v-else>Chờ khám</span>
  </VueTag>
  <VueTag v-else-if="ticket.ticketStatus === TicketStatus.Executing" color="cyan" icon="form">
    <span v-if="ticket.ticketType === TicketType.Order">Đang xử lý</span>
    <span v-else>Đang khám</span>
  </VueTag>
  <VueTag v-else-if="ticket.ticketStatus === TicketStatus.Debt" color="red" icon="minus">Nợ</VueTag>
  <VueTag v-else-if="ticket.ticketStatus === TicketStatus.Completed" color="green" icon="check">
    Hoàn thành
  </VueTag>
  <VueTag v-else-if="ticket.ticketStatus === TicketStatus.Cancelled" color="default" icon="stop">
    Hủy
  </VueTag>
</template>
