<script setup lang="ts">
import { TicketRadiologyStatus } from '@/modules/ticket-radiology'
import VueTag from '@/common/VueTag.vue'

const props = withDefaults(defineProps<{ status: TicketRadiologyStatus }>(), {
  status: TicketRadiologyStatus.Pending,
})
</script>

<template>
  <VueTag v-if="status === TicketRadiologyStatus.Pending" color="orange" icon="exclamation">
    Đang chờ
  </VueTag>

  <VueTag v-else-if="status === TicketRadiologyStatus.Completed" color="green" icon="check">
    Hoàn thành
  </VueTag>
</template>
