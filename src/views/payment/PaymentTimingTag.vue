<script setup lang="ts">
import VueTag from '../../common/VueTag.vue'
import { PaymentTiming, PaymentTimingText } from '../../modules/payment/payment.model'

const props = withDefaults(defineProps<{ paymentTiming?: PaymentTiming | undefined }>(), {
  paymentTiming: undefined,
})
</script>

<template>
  <VueTag v-if="paymentTiming == null" color="default" icon="close">Unknown</VueTag>
  <VueTag v-else-if="paymentTiming === PaymentTiming.Other" bg-color="green" icon="send">
    {{ PaymentTimingText[PaymentTiming.Other] }}
  </VueTag>
  <VueTag v-else-if="paymentTiming === PaymentTiming.Prepayment" color="blue" icon="send">
    {{ PaymentTimingText[PaymentTiming.Prepayment] }}
  </VueTag>
  <VueTag v-else-if="paymentTiming === PaymentTiming.PayDebt" color="orange" icon="minus">
    {{ PaymentTimingText[PaymentTiming.PayDebt] }}
  </VueTag>
  <VueTag v-else-if="paymentTiming === PaymentTiming.Close" color="green" icon="check">
    {{ PaymentTimingText[PaymentTiming.Close] }}
  </VueTag>
  <VueTag v-else-if="paymentTiming === PaymentTiming.ReceiveRefund" color="red" icon="rollback">
    {{ PaymentTimingText[PaymentTiming.ReceiveRefund] }}
  </VueTag>
  <VueTag v-else-if="paymentTiming === PaymentTiming.Reopen" color="purple" icon="rollback">
    {{ PaymentTimingText[PaymentTiming.Reopen] }}
  </VueTag>
  <VueTag v-else-if="paymentTiming === PaymentTiming.TopUp" bg-color="violet" icon="send">
    {{ PaymentTimingText[PaymentTiming.TopUp] }}
  </VueTag>
</template>
