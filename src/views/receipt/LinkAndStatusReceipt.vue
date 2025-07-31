<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Receipt } from '../../modules/receipt'
import ReceiptStatusTag from './ReceiptStatusTag.vue'
import { VueTag } from '../../common'

const props = withDefaults(
  defineProps<{
    receipt?: Receipt
    receiptId?: number
    link?: boolean
    status?: boolean
  }>(),
  {
    receipt: () => Receipt.blank(),
    receiptId: 0,
    link: true,
    status: true,
  },
)
const router = useRouter()

const openBlankReceiptDetail = async (receiptId: number) => {
  const route = router.resolve({
    name: 'ReceiptDetail',
    params: { id: receiptId },
  })
  window.open(route.href, '_blank')
}
</script>

<template>
  <div v-if="!receipt.id" style="">
    <VueTag icon="exclamation">RC{{ receiptId }} - Bị xóa</VueTag>
  </div>
  <div v-else style="">
    <a v-if="link" style="margin-right: 0.5em" @click="openBlankReceiptDetail(receipt.id)">
      RC{{ receipt.id }}
    </a>
    <ReceiptStatusTag v-if="status" :receipt="receipt" />
  </div>
</template>
