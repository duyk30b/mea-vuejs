<script setup lang="ts">
import { useSettingStore } from '../../modules/_me/setting.store'
import { PaymentMethod } from '../../modules/payment-method'
import { Ticket } from '../../modules/ticket'
import { timeToText } from '../../utils'
import PaymentTimingTag from '../payment/PaymentTimingTag.vue'

defineProps<{
  ticket: Ticket
  paymentMethodMap: Record<string, PaymentMethod>
}>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
</script>

<template>
  <div>
    <div class="flex flex-wrap items-baseline justify-between">
      <div class="italic">Lịch sử thanh toán</div>
      <div>
        <span class="mr-2">Tổng tiền:</span>
        <span class="pr-2 font-bold" style="font-size: 16px">
          {{ formatMoney(ticket.totalMoney) }}
        </span>
      </div>
    </div>
    <div class="mt-2 table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Thời gian</th>
            <th>Loại</th>
            <th>Số tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(payment, index) in ticket.paymentList" :key="index">
            <td class="text-center">
              {{ index + 1 }}
            </td>
            <td class="text-left">
              <div>
                {{ timeToText(payment.createdAt, 'DD/MM/YY hh:mm') }}
              </div>
              <div>{{ paymentMethodMap[payment.paymentMethodId]?.name || '' }}</div>
              <div v-if="payment.note" style="font-size: 0.8rem">
                {{ payment.note }}
              </div>
              <div v-if="payment.description" style="font-size: 0.8rem; font-style: italic">
                {{ payment.description }}
              </div>
            </td>
            <td>
              <PaymentTimingTag :paymentTiming="payment.paymentTiming" />
            </td>
            <td class="text-right">
              <div>{{ formatMoney(payment.paidAmount) }}</div>
            </td>
          </tr>
          <tr>
            <td colspan="3" class="text-right">Tổng đã thanh toán :</td>
            <td class="text-right font-bold">{{ formatMoney(ticket.paid) }}</td>
          </tr>
          <tr v-if="ticket.debt >= 0">
            <td colspan="3" class="text-right">Đang thiếu :</td>
            <td class="text-right font-bold">{{ formatMoney(ticket.debt) }}</td>
          </tr>
          <tr v-else style="color: var(--text-green)">
            <td colspan="3" class="text-right">Đang thừa</td>
            <td class="text-right font-bold">{{ formatMoney(-ticket.debt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
