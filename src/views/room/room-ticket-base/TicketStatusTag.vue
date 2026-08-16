<script setup lang="ts">
import VueTag from '@/common/VueTag.vue'
import { RoomService, RoomType } from '@/modules/room'
import { Ticket } from '@/modules/ticket'
import { TicketStatus } from '@/modules/ticket/ticket.type'

const props = withDefaults(defineProps<{ ticket?: Ticket | undefined }>(), {
  ticket: undefined,
})

const roomMap = RoomService.roomMap
</script>

<template>
  <VueTag v-if="!ticket" bg-color="red" icon="close">Bị xóa</VueTag>
  <VueTag v-else-if="ticket.status === TicketStatus.Draft" color="orange" icon="exclamation">
    <span v-if="roomMap[ticket.roomId]?.roomType === RoomType.TicketOrder">Nháp</span>
    <span v-else>Chờ khám</span>
  </VueTag>
  <VueTag v-else-if="ticket.status === TicketStatus.Schedule" color="purple" icon="calendar">
    <span v-if="roomMap[ticket.roomId]?.roomType === RoomType.TicketOrder">Đặt hàng</span>
    <span v-else>Hẹn khám</span>
  </VueTag>
  <VueTag v-else-if="ticket.status === TicketStatus.Executing" color="cyan" icon="form">
    <span v-if="roomMap[ticket.roomId]?.roomType === RoomType.TicketOrder">Đang xử lý</span>
    <span v-else>Đang điều trị</span>
  </VueTag>
  <VueTag v-else-if="ticket.status === TicketStatus.Debt" color="red" icon="minus">Nợ</VueTag>
  <VueTag v-else-if="ticket.status === TicketStatus.Completed" color="green" icon="check">
    Hoàn thành
  </VueTag>
  <VueTag v-else-if="ticket.status === TicketStatus.Cancelled" color="default" icon="stop">
    Hủy
  </VueTag>
</template>
