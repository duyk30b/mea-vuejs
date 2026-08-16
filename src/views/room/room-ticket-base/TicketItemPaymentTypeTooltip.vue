<script setup lang="ts">
import { IconDollar, IconMinusCircle } from '@/common/icon-antd'
import { VueTooltip } from '@/common/popover'
import { TicketItemPaymentType } from '@/modules/enum'

const props = withDefaults(defineProps<{ ticketItemPaymentType: TicketItemPaymentType }>(), {
  ticketItemPaymentType: TicketItemPaymentType.TicketPaid,
})
</script>

<template>
  <div class="flex justify-center">
    <VueTooltip v-if="ticketItemPaymentType === TicketItemPaymentType.NoEffect">
      <template #trigger>
        <IconMinusCircle style="font-size: 18px; cursor: not-allowed" />
      </template>
      <div>Không áp dụng</div>
    </VueTooltip>
    <VueTooltip v-if="ticketItemPaymentType === TicketItemPaymentType.TicketPaid">
      <template #trigger>
        <IconDollar style="font-size: 18px; color: var(--text-cyan); cursor: not-allowed" />
      </template>
      <div>Thanh toán cùng phiếu</div>
    </VueTooltip>
    <VueTooltip v-if="ticketItemPaymentType === TicketItemPaymentType.PendingPayment">
      <template #trigger>
        <IconDollar style="font-size: 18px; color: orange; cursor: not-allowed" />
      </template>
      <div>Chờ thanh toán</div>
    </VueTooltip>
    <VueTooltip v-else-if="ticketItemPaymentType === TicketItemPaymentType.PartialPaid">
      <template #trigger>
        <IconDollar style="color: var(--text-blue); font-size: 18px; cursor: not-allowed" />
      </template>
      <div>Thanh toán một phần</div>
    </VueTooltip>
    <VueTooltip v-else-if="ticketItemPaymentType === TicketItemPaymentType.FullPaid">
      <template #trigger>
        <IconDollar style="color: var(--text-green); font-size: 18px; cursor: not-allowed" />
      </template>
      <div>Đã thanh toán</div>
    </VueTooltip>
    <VueTooltip v-else-if="ticketItemPaymentType === TicketItemPaymentType.Debt">
      <template #trigger>
        <IconDollar style="color: var(--text-red); font-size: 18px; cursor: not-allowed" />
      </template>
      <div>NỢ</div>
    </VueTooltip>
  </div>
</template>

<style lang="scss" scoped></style>
