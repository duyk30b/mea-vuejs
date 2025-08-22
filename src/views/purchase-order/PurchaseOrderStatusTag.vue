<script setup lang="ts">
import VueTag from '../../common/VueTag.vue'
import { PurchaseOrder, PurchaseOrderStatus } from '../../modules/purchase-order'

const props = withDefaults(defineProps<{ purchaseOrder?: PurchaseOrder | undefined }>(), {
  purchaseOrder: undefined,
})
</script>

<template>
  <VueTag v-if="!purchaseOrder" color="default" icon="close">Bị xóa</VueTag>
  <VueTag
    v-else-if="purchaseOrder.status === PurchaseOrderStatus.Draft"
    color="orange"
    icon="exclamation"
  >
    Nháp
  </VueTag>
  <VueTag
    v-else-if="purchaseOrder.status === PurchaseOrderStatus.Deposited"
    color="blue"
    icon="send"
  >
    Đặt hàng
  </VueTag>
  <VueTag
    v-else-if="purchaseOrder.status === PurchaseOrderStatus.Executing"
    color="cyan"
    icon="form"
  >
    Đang xử lý
  </VueTag>
  <VueTag v-else-if="purchaseOrder.status === PurchaseOrderStatus.Debt" color="red" icon="minus">
    Nợ
  </VueTag>
  <VueTag
    v-else-if="purchaseOrder.status === PurchaseOrderStatus.Completed"
    color="green"
    icon="check"
  >
    Hoàn thành
  </VueTag>
  <VueTag
    v-else-if="purchaseOrder.status === PurchaseOrderStatus.Cancelled"
    color="default"
    icon="stop"
  >
    Hủy
  </VueTag>
</template>
