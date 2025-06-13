<script setup lang="ts">
import VueTag from '@/common/VueTag.vue'
import { TicketLaboratoryStatus } from '@/modules/ticket-laboratory'

const props = withDefaults(defineProps<{ status: TicketLaboratoryStatus }>(), {
  status: TicketLaboratoryStatus.Pending,
})
</script>

<template>
  <VueTag v-if="status === TicketLaboratoryStatus.Pending" color="orange" icon="exclamation">
    Đang chờ
  </VueTag>

  <VueTag v-else-if="status === TicketLaboratoryStatus.Completed" color="green" icon="check">
    Hoàn thành
  </VueTag>
</template>
