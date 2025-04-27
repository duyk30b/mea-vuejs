<script setup lang="ts">
import VueTag from '../../common/VueTag.vue'
import { PaymentType } from '../../modules/enum'

defineProps<{ paymentType: PaymentType }>()
</script>

<template>
  <VueTag v-if="paymentType === PaymentType.Prepayment" color="blue" icon="exclamation">
    Tạm ứng
  </VueTag>
  <VueTag v-if="paymentType === PaymentType.PayDebt" color="cyan" icon="minus">Trả nợ</VueTag>
  <VueTag v-if="paymentType === PaymentType.Close" color="green" icon="check">Đóng phiếu</VueTag>
  <VueTag v-if="paymentType === PaymentType.ReceiveRefund" color="orange" icon="minus">
    Hoàn trả
  </VueTag>
  <VueTag v-if="paymentType === PaymentType.Reopen" color="purple" icon="close">
    Mở lại phiếu
  </VueTag>
</template>
