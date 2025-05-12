<script setup lang="ts">
import { IconClockCircle, IconMinusCircle, IconShoppingCart } from '../../common/icon-antd'
import { VueTooltip } from '../../common/popover'
import { DeliveryStatus } from '../../modules/enum'

const props = withDefaults(defineProps<{ deliveryStatus: DeliveryStatus }>(), {
  deliveryStatus: DeliveryStatus.NoStock,
})
</script>

<template>
  <VueTooltip v-if="deliveryStatus === DeliveryStatus.NoStock">
    <template #trigger>
      <IconMinusCircle style="font-size: 18px; color: #555; cursor: not-allowed" />
    </template>
    <div>Không có thuốc - vật tư</div>
  </VueTooltip>

  <VueTooltip v-else-if="deliveryStatus === DeliveryStatus.Pending">
    <template #trigger>
      <IconClockCircle style="font-size: 18px; color: orange; cursor: not-allowed" />
    </template>
    <div>Chưa xuất thuốc - vật tư</div>
  </VueTooltip>

  <VueTooltip v-else-if="deliveryStatus === DeliveryStatus.Delivered">
    <template #trigger>
      <IconShoppingCart style="color: #52c41a; font-size: 18px; cursor: not-allowed" />
    </template>
    <div>Đã xuất thuốc - vật tư</div>
  </VueTooltip>
</template>

<style lang="scss" scoped></style>
