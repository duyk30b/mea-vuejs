<script setup lang="ts">
import { IconClockCircle, IconCloseCircle, IconShoppingCart } from '@/common/icon-antd'
import VueTag from '@/common/VueTag.vue'
import { DeliveryStatus } from '@/modules/enum'

const props = withDefaults(defineProps<{ deliveryStatus: DeliveryStatus }>(), {
  deliveryStatus: DeliveryStatus.NoStock,
})
</script>

<template>
  <VueTag v-if="deliveryStatus === DeliveryStatus.NoStock" color="default">
    <IconCloseCircle />
    <span>Không có thuốc - vật tư</span>
  </VueTag>
  <VueTag v-else-if="deliveryStatus === DeliveryStatus.Pending" color="orange" icon="clock">
    <template #icon>
      <IconClockCircle />
    </template>
    <span>Chưa xuất thuốc - vật tư</span>
  </VueTag>
  <VueTag v-else-if="deliveryStatus === DeliveryStatus.Delivered" color="green">
    <IconShoppingCart />
    <span>Đã xuất thuốc - vật tư</span>
  </VueTag>
</template>

<style lang="scss" scoped></style>
