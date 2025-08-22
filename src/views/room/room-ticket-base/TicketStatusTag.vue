<script setup lang="ts">
import VueTag from '@/common/VueTag.vue'
import { RoomService, RoomTicketStyle } from '@/modules/room'
import { Ticket, TicketStatus } from '@/modules/ticket'

const props = withDefaults(defineProps<{ ticket?: Ticket | undefined }>(), {
  ticket: undefined,
})

const roomMap = RoomService.roomMap
</script>

<template>
  <VueTag v-if="!ticket" bg-color="red" icon="close">Bị xóa</VueTag>
  <VueTag v-else-if="ticket.status === TicketStatus.Schedule" color="purple" icon="calendar">
    <span v-if="roomMap[ticket.roomId]?.roomStyle === RoomTicketStyle.TicketOrder">Xem trước</span>
    <span v-else-if="roomMap[ticket.roomId]?.roomStyle === RoomTicketStyle.TicketSpa">Đặt hẹn</span>
    <span v-else>Hẹn khám</span>
  </VueTag>
  <VueTag v-else-if="ticket.status === TicketStatus.Draft" color="orange" icon="exclamation">
    <span v-if="roomMap[ticket.roomId]?.roomStyle === RoomTicketStyle.TicketOrder">Nháp</span>
    <span v-else-if="roomMap[ticket.roomId]?.roomStyle === RoomTicketStyle.TicketSpa">
      Đang chờ
    </span>
    <span v-else>Chờ khám</span>
  </VueTag>
  <VueTag v-else-if="ticket.status === TicketStatus.Deposited" color="blue" icon="clock">
    <span v-if="roomMap[ticket.roomId]?.roomStyle === RoomTicketStyle.TicketOrder">Nháp</span>
    <span v-else-if="roomMap[ticket.roomId]?.roomStyle === RoomTicketStyle.TicketSpa">Đặt chỗ</span>
    <span v-else>Đặt khám</span>
  </VueTag>
  <VueTag v-else-if="ticket.status === TicketStatus.Executing" color="cyan" icon="form">
    <span v-if="roomMap[ticket.roomId]?.roomStyle === RoomTicketStyle.TicketOrder">Đang xử lý</span>
    <span v-else-if="roomMap[ticket.roomId]?.roomStyle === RoomTicketStyle.TicketSpa">
      Đang xử lý
    </span>
    <span v-else>Đang khám</span>
  </VueTag>
  <VueTag v-else-if="ticket.status === TicketStatus.Debt" color="red" icon="minus">Nợ</VueTag>
  <VueTag v-else-if="ticket.status === TicketStatus.Completed" color="green" icon="check">
    Hoàn thành
  </VueTag>
  <VueTag v-else-if="ticket.status === TicketStatus.Cancelled" color="default" icon="stop">
    Hủy
  </VueTag>
</template>
