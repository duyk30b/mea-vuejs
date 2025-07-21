<script setup lang="ts">
import { IconCheckSquare, IconClockCircle } from '@/common/icon-antd'
import { VueTooltip } from '@/common/popover'
import { TicketRadiologyStatus } from '@/modules/ticket-radiology'

const props = withDefaults(defineProps<{ status: TicketRadiologyStatus }>(), {
  status: TicketRadiologyStatus.Pending,
})
</script>

<template>
  <div class="flex justify-center">
    <div v-if="status === TicketRadiologyStatus.Empty"></div>
    <VueTooltip v-else-if="status === TicketRadiologyStatus.Pending">
      <template #trigger>
        <IconClockCircle style="font-size: 18px; color: orange; cursor: not-allowed" />
      </template>
      <div>Chưa có kết quả</div>
    </VueTooltip>

    <VueTooltip v-else>
      <template #trigger>
        <IconCheckSquare style="color: #52c41a; font-size: 18px; cursor: not-allowed" />
      </template>
      <div>Đã hoàn thành</div>
    </VueTooltip>
  </div>
</template>
