<script setup lang="ts">
import { CheckCircleOutlined, ExclamationCircleOutlined, StopOutlined } from '@ant-design/icons-vue'
import { TicketStatus } from '../../modules/ticket'
import VueTag from '../../common/VueTag.vue'

const props = defineProps<{ ticketStatus: TicketStatus }>()
</script>

<template>
  <VueTag v-if="ticketStatus === TicketStatus.Draft" color="orange" icon="exclamation">Nháp</VueTag>
  <VueTag v-else-if="ticketStatus === TicketStatus.Approved" color="blue" icon="exclamation">
    Tạm ứng
  </VueTag>
  <VueTag v-else-if="ticketStatus === TicketStatus.Executing" color="cyan" icon="send">
    Đã gửi hàng
  </VueTag>
  <VueTag v-else-if="ticketStatus === TicketStatus.Debt" color="orange" icon="minus">Nợ</VueTag>

  <VueTag v-else-if="ticketStatus === TicketStatus.Completed" color="green" icon="check">
    Hoàn thành
  </VueTag>
  <VueTag v-else-if="ticketStatus === TicketStatus.Cancelled" color="default" icon="stop">
    Hủy
  </VueTag>
</template>
