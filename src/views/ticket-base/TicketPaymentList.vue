<script setup lang="ts">
import { CONFIG } from '@/config'
import { useSettingStore } from '../../modules/_me/setting.store'
import { PaymentMethod } from '../../modules/payment-method'
import { Ticket } from '../../modules/ticket'
import { timeToText } from '../../utils'

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
            <th v-if="CONFIG.MODE === 'development'">ID</th>
            <th>#</th>
            <th>Thời gian</th>
            <th>Note</th>
            <th>Số tiền</th>
            <th v-if="CONFIG.MODE === 'development'">Ghi nợ</th>
            <th v-if="CONFIG.MODE === 'development'">Nợ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(paymentItem, index) in ticket.paymentItemList" :key="index">
            <td v-if="CONFIG.MODE === 'development'" style="color: violet" class="text-center">
              {{ paymentItem.id }}
            </td>
            <td class="text-center">{{ index + 1 }}</td>
            <td class="text-center">
              {{ timeToText(paymentItem.createdAt, 'DD/MM/YY hh:mm') }}
            </td>
            <td>
              <div>{{ paymentItem.note }}</div>
            </td>
            <td class="text-right">
              <div>{{ formatMoney(paymentItem.paidAmount) }}</div>
            </td>
            <td class="text-right" v-if="CONFIG.MODE === 'development'" style="color: violet">
              {{ formatMoney(paymentItem.debtAmount) }}
            </td>
            <td class="text-right" v-if="CONFIG.MODE === 'development'" style="color: violet">
              {{ formatMoney(paymentItem.openDebt) }} ->
              {{ formatMoney(paymentItem.closeDebt) }}
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
