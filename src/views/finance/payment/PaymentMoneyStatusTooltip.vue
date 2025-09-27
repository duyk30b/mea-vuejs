<script setup lang="ts">
import { IconDollar } from '@/common/icon-antd'
import { VueTooltip } from '@/common/popover'
import { PaymentMoneyStatus } from '@/modules/enum'

const props = withDefaults(defineProps<{ paymentMoneyStatus: PaymentMoneyStatus }>(), {
  paymentMoneyStatus: PaymentMoneyStatus.PendingPaid,
})
</script>

<template>
  <div class="flex justify-center">
    <VueTooltip v-if="paymentMoneyStatus === PaymentMoneyStatus.PendingPaid">
      <template #trigger>
        <IconDollar style="font-size: 18px; color: orange; cursor: not-allowed" />
      </template>
      <div>Chờ thanh toán</div>
    </VueTooltip>
    <VueTooltip v-else-if="paymentMoneyStatus === PaymentMoneyStatus.Paid">
      <template #trigger>
        <IconDollar style="color: #52c41a; font-size: 18px; cursor: not-allowed" />
      </template>
      <div>Đã thanh toán</div>
    </VueTooltip>
  </div>
</template>

<style lang="scss" scoped></style>
