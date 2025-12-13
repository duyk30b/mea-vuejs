<script setup lang="ts">
import { PurchaseOrder } from '@/modules/purchase-order'

const props = withDefaults(
  defineProps<{ purchaseOrder?: PurchaseOrder | undefined; purchaseOrderId: string }>(),
  {
    purchaseOrder: () => PurchaseOrder.blank(),
    purchaseOrderId: '0',
  },
)
</script>

<template>
  <span v-if="!purchaseOrder?.id" style="color: #555; font-weight: bold">
    PO{{ purchaseOrderId.slice(0, 8) }}
  </span>
  <span v-else>
    <router-link
      :to="{
        name: 'PurchaseOrderDetailContainer',
        params: { id: purchaseOrderId },
      }"
    >
      <span>PO_</span>
      <span>{{ purchaseOrder.id.slice(0, 12) }}</span>
    </router-link>
  </span>
</template>
