<script setup lang="ts">
import { IconCheckSquare, IconClockCircle, IconExclamationCircle } from '@/common/icon-antd'
import { VueTooltip } from '@/common/popover'
import { TicketProcedureStatus } from '@/modules/ticket-procedure'

const props = withDefaults(defineProps<{ status: TicketProcedureStatus }>(), {
  status: TicketProcedureStatus.Pending,
})
</script>

<template>
  <div class="flex justify-center">
    <div v-if="status === TicketProcedureStatus.Empty"></div>
    <VueTooltip v-else-if="status === TicketProcedureStatus.Pending">
      <template #trigger>
        <IconClockCircle style="font-size: 18px; color: orange; cursor: not-allowed" />
      </template>
      <div>Đợi thực hiện</div>
    </VueTooltip>

    <VueTooltip v-else-if="status === TicketProcedureStatus.Executing">
      <template #trigger>
        <IconExclamationCircle
          style="color: var(--text-blue); font-size: 18px; cursor: not-allowed"
        />
      </template>
      <div>Đang thực hiện</div>
    </VueTooltip>

    <VueTooltip v-else>
      <template #trigger>
        <IconCheckSquare style="color: #52c41a; font-size: 18px; cursor: not-allowed" />
      </template>
      <div>Đã hoàn thành</div>
    </VueTooltip>
  </div>
</template>
