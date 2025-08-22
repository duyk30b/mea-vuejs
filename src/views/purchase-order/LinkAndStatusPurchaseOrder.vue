<script setup lang="ts">
import { VueTag } from '@/common'
import { PurchaseOrder } from '@/modules/purchase-order'
import { useRouter } from 'vue-router'
import PurchaseOrderStatusTag from './PurchaseOrderStatusTag.vue'

const props = withDefaults(
  defineProps<{
    purchaseOrder?: PurchaseOrder
    purchaseOrderId?: number
    link?: boolean
    status?: boolean
  }>(),
  {
    purchaseOrder: () => PurchaseOrder.blank(),
    purchaseOrderId: 0,
    link: true,
    status: true,
  },
)
const router = useRouter()

const openBlankPurchaseOrderDetail = async (purchaseOrderId: number) => {
  const route = router.resolve({
    name: 'PurchaseOrderDetailContainer',
    params: { id: purchaseOrderId },
  })
  window.open(route.href, '_blank')
}
</script>

<template>
  <div v-if="!purchaseOrder.id" style="">
    <VueTag icon="exclamation">RC{{ purchaseOrderId }} - Bị xóa</VueTag>
  </div>
  <div v-else style="">
    <a
      v-if="link"
      style="margin-right: 0.5em"
      @click="openBlankPurchaseOrderDetail(purchaseOrder.id)"
    >
      RC{{ purchaseOrder.id }}
    </a>
    <PurchaseOrderStatusTag v-if="status" :purchaseOrder="purchaseOrder" />
  </div>
</template>
