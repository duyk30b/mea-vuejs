<script setup lang="ts">
import { IconDollar, IconMinusCircle } from '@/common/icon-antd'
import { VueTooltip } from '@/common/popover'
import { PaymentMoneyStatus } from '@/modules/enum'

const props = withDefaults(defineProps<{ paymentMoneyStatus: PaymentMoneyStatus }>(), {
  paymentMoneyStatus: PaymentMoneyStatus.TicketPaid,
})
</script>

<template>
  <div class="flex justify-center">
    <VueTooltip v-if="paymentMoneyStatus === PaymentMoneyStatus.NoEffect">
      <template #trigger>
        <IconMinusCircle style="font-size: 18px; cursor: not-allowed" />
      </template>
      <div>Không áp dụng thanh toán</div>
    </VueTooltip>
    <VueTooltip v-if="paymentMoneyStatus === PaymentMoneyStatus.TicketPaid">
      <template #trigger>
        <IconDollar style="font-size: 18px; color: orange; cursor: not-allowed" />
      </template>
      <div>Thanh toán cùng phiếu</div>
    </VueTooltip>
    <VueTooltip v-if="paymentMoneyStatus === PaymentMoneyStatus.PendingPayment">
      <template #trigger>
        <IconDollar style="font-size: 18px; color: orange; cursor: not-allowed" />
      </template>
      <div>Chờ thanh toán</div>
    </VueTooltip>
    <VueTooltip v-else-if="paymentMoneyStatus === PaymentMoneyStatus.PartialPaid">
      <template #trigger>
        <IconDollar style="color: var(--text-blue); font-size: 18px; cursor: not-allowed" />
      </template>
      <div>Thanh toán một phần</div>
    </VueTooltip>
    <VueTooltip v-else-if="paymentMoneyStatus === PaymentMoneyStatus.FullPaid">
      <template #trigger>
        <IconDollar style="color: #52c41a; font-size: 18px; cursor: not-allowed" />
      </template>
      <div>Đã thanh toán</div>
    </VueTooltip>
  </div>
</template>

<style lang="scss" scoped></style>
