<script setup lang="ts">
import VueTag from '../../common/VueTag.vue'
import { Receipt, ReceiptStatus } from '../../modules/receipt'

const props = withDefaults(defineProps<{ receipt?: Receipt | undefined }>(), { receipt: undefined })
</script>

<template>
  <VueTag v-if="!receipt" color="default" icon="close">Bị xóa</VueTag>
  <VueTag v-else-if="receipt.status === ReceiptStatus.Draft" color="orange" icon="exclamation">
    Nháp
  </VueTag>
  <VueTag v-else-if="receipt.status === ReceiptStatus.Prepayment" color="blue" icon="exclamation">
    Tạm ứng
  </VueTag>
  <VueTag v-else-if="receipt.status === ReceiptStatus.Debt" color="cyan" icon="minus">Nợ</VueTag>
  <VueTag v-else-if="receipt.status === ReceiptStatus.Success" color="green" icon="check">
    Hoàn thành
  </VueTag>
  <VueTag v-else-if="receipt.status === ReceiptStatus.Cancelled" color="default" icon="stop">
    Hủy
  </VueTag>
</template>
