<script setup lang="ts">
import {
  CheckCircleOutlined,
  CustomerServiceOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  InteractionOutlined,
} from '@ant-design/icons-vue'
import { TicketStatus } from '../../modules/ticket'
import VueTag from '../../common/VueTag.vue'

const props = defineProps<{ ticketStatus: TicketStatus }>()
</script>

<template>
  <VueTag v-if="ticketStatus === TicketStatus.Schedule" color="cyan">
    <InteractionOutlined />
    <span>Hẹn khám</span>
  </VueTag>
  <VueTag v-if="ticketStatus === TicketStatus.Draft" color="orange" icon="clock">Chờ khám</VueTag>
  <VueTag v-if="ticketStatus === TicketStatus.Approved" color="blue" icon="clock">Chờ khám</VueTag>
  <VueTag v-if="ticketStatus === TicketStatus.Executing" color="cyan">
    <CustomerServiceOutlined />
    <span>Đang khám</span>
  </VueTag>
  <VueTag v-if="ticketStatus === TicketStatus.Debt" color="red" icon="exclamation">Nợ</VueTag>
  <VueTag v-if="ticketStatus === TicketStatus.Completed" color="green" icon="check">
    Hoàn thành
  </VueTag>
</template>

<style lang="scss" scoped></style>
