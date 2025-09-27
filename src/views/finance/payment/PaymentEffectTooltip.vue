<script setup lang="ts">
import { IconDollar } from '@/common/icon-antd'
import { VueTooltip } from '@/common/popover'
import { PaymentEffect } from '@/modules/enum'

const props = withDefaults(defineProps<{ paymentEffect: PaymentEffect }>(), {
  paymentEffect: PaymentEffect.SelfPayment,
})
</script>

<template>
  <div class="flex justify-center">
    <VueTooltip v-if="paymentEffect === PaymentEffect.SelfPayment">
      <template #trigger>
        <IconDollar style="font-size: 18px; color: orange; cursor: not-allowed" />
      </template>
      <div>Phải thanh toán</div>
    </VueTooltip>
    <VueTooltip v-else-if="paymentEffect === PaymentEffect.RelationPayment">
      <template #trigger>
        <IconDollar style="color: #52c41a; font-size: 18px; cursor: not-allowed" />
      </template>
      <div>Không áp dụng</div>
    </VueTooltip>
  </div>
</template>

<style lang="scss" scoped></style>
