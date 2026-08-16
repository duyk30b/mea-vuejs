<script setup lang="ts">
import { PurchaseOrder } from '@/modules/purchase-order'
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{
    purchaseOrder?: PurchaseOrder | undefined
    purchaseOrderId: string
    target?: '_blank' | '_self'
  }>(),
  {
    purchaseOrder: () => PurchaseOrder.blank(),
    purchaseOrderId: '0',
    target: '_self',
  },
)

const router = useRouter()

const openLinkBlankPurchaseOrder = async (purchaseOrder: PurchaseOrder) => {
  const route = router.resolve({
    name: 'PurchaseOrderDetailContainer',
    params: { id: purchaseOrder.id },
  })
  window.open(route.href, '_blank')
}
</script>

<template>
  <span
    v-if="!purchaseOrder?.id || purchaseOrder.id === '0'"
    style="color: #555; font-weight: bold"
  >
    PO{{ purchaseOrderId.slice(-10) }}
  </span>
  <template v-else-if="props.target === '_self'">
    <span>
      <router-link
        :to="{
          name: 'PurchaseOrderDetailContainer',
          params: { id: purchaseOrderId },
        }"
      >
        PO_{{ purchaseOrderId.slice(-10) }}
      </router-link>
    </span>
  </template>
  <template v-else-if="props.target === '_blank'">
    <a @click="openLinkBlankPurchaseOrder(purchaseOrder)">PO_{{ purchaseOrderId.slice(-10) }}</a>
  </template>
</template>
