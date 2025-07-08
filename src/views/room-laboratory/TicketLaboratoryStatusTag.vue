<script setup lang="ts">
import { TicketLaboratoryStatus } from '@/modules/ticket-laboratory'
import VueTag from '../../common/VueTag.vue'

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
