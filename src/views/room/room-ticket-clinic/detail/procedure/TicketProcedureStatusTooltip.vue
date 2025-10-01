<script setup lang="ts">
import { IconCheckSquare, IconClockCircle, IconMinusCircle } from '@/common/icon-antd'
import { VueTooltip } from '@/common/popover'
import { TicketProcedureStatus } from '@/modules/ticket-procedure'

const props = withDefaults(defineProps<{ status: TicketProcedureStatus }>(), {
  status: TicketProcedureStatus.Pending,
})
</script>

<template>
  <div class="flex justify-center">
    <VueTooltip v-if="status === TicketProcedureStatus.NoEffect">
      <template #trigger>
        <IconMinusCircle style="font-size: 18px; color: #666; cursor: not-allowed" />
      </template>
      <div>Nháp</div>
    </VueTooltip>
    <span v-else-if="status === TicketProcedureStatus.NoAction">
      <IconMinusCircle style="font-size: 18px; color: #666; cursor: not-allowed" />
    </span>
    <VueTooltip v-else-if="status === TicketProcedureStatus.Pending">
      <template #trigger>
        <IconClockCircle style="font-size: 18px; color: orange; cursor: not-allowed" />
      </template>
      <div>Chờ thực hiện</div>
    </VueTooltip>

    <VueTooltip v-else>
      <template #trigger>
        <IconCheckSquare style="color: #52c41a; font-size: 18px; cursor: not-allowed" />
      </template>
      <div>Hoàn thành</div>
    </VueTooltip>
  </div>
</template>
