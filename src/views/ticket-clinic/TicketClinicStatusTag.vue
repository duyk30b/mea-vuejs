<script setup lang="ts">
import {
  CheckCircleOutlined,
  CustomerServiceOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  InteractionOutlined,
} from '@ant-design/icons-vue'
import { TicketStatus } from '../../modules/ticket'

const props = defineProps<{ ticketStatus: TicketStatus }>()
</script>

<template>
  <a-tag v-if="ticketStatus === TicketStatus.Schedule" color="cyan">
    <template #icon>
      <InteractionOutlined />
    </template>
    Hẹn khám
  </a-tag>
  <a-tag v-if="ticketStatus === TicketStatus.Draft" color="warning">
    <template #icon>
      <ClockCircleOutlined />
    </template>
    Chờ khám
  </a-tag>
  <a-tag v-if="ticketStatus === TicketStatus.Approved" color="warning">
    <template #icon>
      <ClockCircleOutlined />
    </template>
    Chờ khám
  </a-tag>
  <a-tag v-if="ticketStatus === TicketStatus.Executing" color="processing">
    <template #icon>
      <CustomerServiceOutlined />
    </template>
    Đang khám
  </a-tag>
  <a-tag v-if="ticketStatus === TicketStatus.Debt" color="error">
    <template #icon>
      <ExclamationCircleOutlined />
    </template>
    Nợ
  </a-tag>
  <a-tag v-if="ticketStatus === TicketStatus.Completed" color="success">
    <template #icon>
      <CheckCircleOutlined />
    </template>
    Hoàn thành
  </a-tag>
</template>

<style lang="scss" scoped></style>
