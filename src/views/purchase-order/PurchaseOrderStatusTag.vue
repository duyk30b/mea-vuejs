<script setup lang="ts">
import VueTag from '@/common/VueTag.vue'
import { PurchaseOrder } from '@/modules/purchase-order'
import {
  PurchaseOrderStatus,
  PurchaseOrderStatusText,
} from '@/modules/purchase-order/purchase-order.type'

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
    {{ PurchaseOrderStatusText[purchaseOrder.status] }}
  </VueTag>
  <VueTag
    v-else-if="purchaseOrder.status === PurchaseOrderStatus.Schedule"
    color="blue"
    icon="send"
  >
    {{ PurchaseOrderStatusText[purchaseOrder.status] }}
  </VueTag>
  <VueTag
    v-else-if="purchaseOrder.status === PurchaseOrderStatus.Executing"
    color="cyan"
    icon="form"
  >
    {{ PurchaseOrderStatusText[purchaseOrder.status] }}
  </VueTag>
  <VueTag v-else-if="purchaseOrder.status === PurchaseOrderStatus.Debt" color="red" icon="minus">
    {{ PurchaseOrderStatusText[purchaseOrder.status] }}
  </VueTag>
  <VueTag
    v-else-if="purchaseOrder.status === PurchaseOrderStatus.Completed"
    color="green"
    icon="check"
  >
    {{ PurchaseOrderStatusText[purchaseOrder.status] }}
  </VueTag>
  <VueTag
    v-else-if="purchaseOrder.status === PurchaseOrderStatus.Cancelled"
    color="default"
    icon="stop"
  >
    {{ PurchaseOrderStatusText[purchaseOrder.status] }}
  </VueTag>
</template>
