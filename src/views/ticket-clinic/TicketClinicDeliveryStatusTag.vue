<script setup lang="ts">
import { IconClock, IconShoppingCart } from '../../common/icon'
import { DeliveryStatus } from '../../modules/enum'

const props = withDefaults(defineProps<{ deliveryStatus: DeliveryStatus }>(), {
  deliveryStatus: DeliveryStatus.NoStock,
})
</script>

<template>
  <a-tag
    v-if="deliveryStatus === DeliveryStatus.NoStock"
    color="default"
    style="display: flex; align-items: center; gap: 0.5em">
    <template #icon>
      <IconShoppingCart />
    </template>
    Không có thuốc - vật tư
  </a-tag>
  <a-tag
    v-else-if="deliveryStatus === DeliveryStatus.Pending"
    color="warning"
    style="display: flex; align-items: center; gap: 0.5em">
    <template #icon>
      <IconClock />
    </template>
    Chưa xuất thuốc - vật tư
  </a-tag>
  <a-tag
    v-else-if="deliveryStatus === DeliveryStatus.Delivered"
    color="success"
    style="display: flex; align-items: center; gap: 0.5em">
    <template #icon>
      <IconShoppingCart />
    </template>
    Đã xuất thuốc - vật tư
  </a-tag>
</template>

<style lang="scss" scoped></style>
