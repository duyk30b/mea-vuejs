<script setup lang="ts">
import { IconCheckSquare, IconClockCircle, IconExclamationCircle } from '@/common/icon-antd'
import { VueTooltip } from '@/common/popover'
import { TicketRegimenStatus, TicketRegimenStatusText } from '@/modules/ticket-regimen'

const props = withDefaults(defineProps<{ status: TicketRegimenStatus }>(), {
  status: TicketRegimenStatus.Pending,
})
</script>

<template>
  <div class="flex justify-center">
    <div v-if="status === TicketRegimenStatus.Empty"></div>
    <VueTooltip v-else-if="status === TicketRegimenStatus.Pending">
      <template #trigger>
        <IconClockCircle style="font-size: 18px; color: orange; cursor: not-allowed" />
      </template>
      <div>{{ TicketRegimenStatusText[status] }}</div>
    </VueTooltip>

    <VueTooltip v-else-if="status === TicketRegimenStatus.Executing">
      <template #trigger>
        <IconExclamationCircle
          style="color: var(--text-blue); font-size: 18px; cursor: not-allowed"
        />
      </template>
      <div>{{ TicketRegimenStatusText[status] }}</div>
    </VueTooltip>

    <VueTooltip v-else-if="status === TicketRegimenStatus.Completed">
      <template #trigger>
        <IconCheckSquare style="color: #52c41a; font-size: 18px; cursor: not-allowed" />
      </template>
      <div>{{ TicketRegimenStatusText[status] }}</div>
    </VueTooltip>

    <VueTooltip v-else-if="status === TicketRegimenStatus.Cancelled">
      <div>{{ TicketRegimenStatusText[status] }}</div>
    </VueTooltip>
  </div>
</template>
