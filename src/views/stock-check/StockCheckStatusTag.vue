<script setup lang="ts">
import VueTag from '../../common/VueTag.vue'
import { StockCheck, StockCheckStatus, StockCheckStatusText } from '../../modules/stock-check'

const props = withDefaults(defineProps<{ stockCheck?: StockCheck | undefined }>(), {
  stockCheck: undefined,
})
</script>

<template>
  <VueTag v-if="!stockCheck" color="default" icon="close">Bị xóa</VueTag>
  <VueTag
    v-else-if="stockCheck.status === StockCheckStatus.Draft"
    color="orange"
    icon="exclamation"
  >
    {{ StockCheckStatusText[StockCheckStatus.Draft] }}
  </VueTag>
  <VueTag v-else-if="stockCheck.status === StockCheckStatus.Pending" color="cyan" icon="clock">
    {{ StockCheckStatusText[StockCheckStatus.Pending] }}
  </VueTag>
  <VueTag v-else-if="stockCheck.status === StockCheckStatus.Confirmed" color="blue" icon="check">
    {{ StockCheckStatusText[StockCheckStatus.Confirmed] }}
  </VueTag>
  <VueTag v-else-if="stockCheck.status === StockCheckStatus.Balanced" color="green" icon="send">
    {{ StockCheckStatusText[StockCheckStatus.Balanced] }}
  </VueTag>
  <VueTag v-else-if="stockCheck.status === StockCheckStatus.Cancelled" color="default" icon="stop">
    {{ StockCheckStatusText[StockCheckStatus.Cancelled] }}
  </VueTag>
</template>
