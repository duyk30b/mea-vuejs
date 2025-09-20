<script setup lang="ts">
import VueTag from '@/common/VueTag.vue'
import { TicketProcedureStatus } from '@/modules/ticket-procedure'

const props = withDefaults(defineProps<{ status: TicketProcedureStatus }>(), {
  status: TicketProcedureStatus.Pending,
})
</script>

<template>
  <div class="flex justify-center items-center">
    <VueTag v-if="status === TicketProcedureStatus.NoEffect" icon="minus"></VueTag>
    <VueTag v-else-if="status === TicketProcedureStatus.Pending" color="orange" icon="clock">
      Đang chờ
    </VueTag>
    <VueTag v-else-if="status === TicketProcedureStatus.Completed" color="green" icon="check">
      Hoàn thành
    </VueTag>
  </div>
</template>
