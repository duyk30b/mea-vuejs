<script setup lang="ts">
import VueTag from '@/common/VueTag.vue'
import { TicketRegimenStatus, TicketRegimenStatusText } from '@/modules/ticket-regimen'

const props = withDefaults(defineProps<{ status: TicketRegimenStatus }>(), {
  status: TicketRegimenStatus.Pending,
})
</script>

<template>
  <div class="flex justify-center items-center">
    <VueTag v-if="status === TicketRegimenStatus.Empty" icon="minus">
      {{ TicketRegimenStatusText[status] }}
    </VueTag>
    <VueTag v-else-if="status === TicketRegimenStatus.Pending" color="orange" icon="clock">
      {{ TicketRegimenStatusText[status] }}
    </VueTag>
    <VueTag v-else-if="status === TicketRegimenStatus.Executing" color="blue" icon="exclamation">
      {{ TicketRegimenStatusText[status] }}
    </VueTag>
    <VueTag v-else-if="status === TicketRegimenStatus.Completed" color="green" icon="check">
      {{ TicketRegimenStatusText[status] }}
    </VueTag>
    <VueTag v-else-if="status === TicketRegimenStatus.Cancelled" color="red" icon="close">
      {{ TicketRegimenStatusText[status] }}
    </VueTag>
  </div>
</template>
