<script setup lang="ts">
import { ShoppingCartOutlined } from '@ant-design/icons-vue'
import { DeliveryStatus } from '../../modules/enum'

const props = withDefaults(defineProps<{ deliveryStatus: DeliveryStatus }>(), {
  deliveryStatus: DeliveryStatus.NoStock,
})
</script>

<template>
  <a-tag v-if="deliveryStatus === DeliveryStatus.NoStock" color="default">
    <template #icon>
      <ShoppingCartOutlined />
    </template>
    Không có thuốc - vật tư
  </a-tag>
  <a-tag v-else-if="deliveryStatus === DeliveryStatus.Pending" color="warning">
    <template #icon>
      <ShoppingCartOutlined />
    </template>
    Chưa xuất thuốc - vật tư
  </a-tag>
  <a-tag v-else-if="deliveryStatus === DeliveryStatus.Delivered" color="success">
    <template #icon>
      <ShoppingCartOutlined />
    </template>
    Đã xuất thuốc - vật tư
  </a-tag>
</template>

<style lang="scss" scoped></style>
