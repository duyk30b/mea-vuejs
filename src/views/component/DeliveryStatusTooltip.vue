<script setup lang="ts">
import { IconMinusCircle, IconSend, IconShoppingCart } from '@/common/icon-antd'
import { VueTooltip } from '@/common/popover'
import { DeliveryStatus } from '@/modules/enum'

const props = withDefaults(defineProps<{ deliveryStatus: DeliveryStatus }>(), {
  deliveryStatus: DeliveryStatus.Empty,
})
</script>

<template>
  <div class="flex justify-center">
    <VueTooltip v-if="deliveryStatus === DeliveryStatus.Empty">
      <template #trigger>
        <IconMinusCircle style="font-size: 18px; color: #555; cursor: not-allowed" />
      </template>
      <div>Không có hàng</div>
    </VueTooltip>
    <VueTooltip v-else-if="deliveryStatus === DeliveryStatus.Pending">
      <template #trigger>
        <IconSend style="font-size: 18px; color: orange; cursor: not-allowed" />
      </template>
      <div>Chưa xuất hàng</div>
    </VueTooltip>
    <VueTooltip v-else-if="deliveryStatus === DeliveryStatus.Partial">
      <template #trigger>
        <IconSend style="font-size: 18px; color: teal; cursor: not-allowed" />
      </template>
      <div>Xuất hàng một phần</div>
    </VueTooltip>
    <VueTooltip v-else-if="deliveryStatus === DeliveryStatus.Delivered">
      <template #trigger>
        <IconShoppingCart style="color: #52c41a; font-size: 18px; cursor: not-allowed" />
      </template>
      <div>Đã xuất hàng</div>
    </VueTooltip>
  </div>
</template>

<style lang="scss" scoped></style>
