<script setup lang="ts">
import { CheckCircleOutlined, ExclamationCircleOutlined, StopOutlined } from '@ant-design/icons-vue'
import { TicketStatus } from '../../modules/ticket'

const props = defineProps<{ ticketStatus: TicketStatus }>()
</script>

<template>
  <a-tag v-if="ticketStatus === TicketStatus.Draft" color="warning">
    <template #icon>
      <ExclamationCircleOutlined />
    </template>
    Nháp
  </a-tag>
  <a-tag v-if="ticketStatus === TicketStatus.Approved" color="processing">
    <template #icon>
      <ExclamationCircleOutlined />
    </template>
    Tạm ứng
  </a-tag>
  <a-tag v-if="ticketStatus === TicketStatus.Executing" color="cyan">
    <template #icon>
      <ExclamationCircleOutlined />
    </template>
    Đã gửi hàng
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
  <a-tag v-if="ticketStatus === TicketStatus.Cancelled" color="default">
    <template #icon>
      <StopOutlined />
    </template>
    Hủy
  </a-tag>
</template>
