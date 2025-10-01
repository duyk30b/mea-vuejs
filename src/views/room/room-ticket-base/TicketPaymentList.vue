<script setup lang="ts">
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { MoneyDirection, PaymentActionTypeText } from '@/modules/payment'
import { PaymentMethodService } from '@/modules/payment-method'
import { Ticket } from '@/modules/ticket'
import { timeToText } from '@/utils'
import { computed, onMounted } from 'vue'

const props = defineProps<{
  ticket: Ticket
}>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const paymentMethodMap = PaymentMethodService.paymentMethodMap

onMounted(async () => {
  try {
    await PaymentMethodService.getAll()
  } catch (error) {
    console.log('🚀 ~ TicketPaymentList.vue:22 ~ error:', error)
  }
})

const hasPaymentOut = computed(() => {
  return props.ticket.paymentList?.some((i) => {
    return i.moneyDirection === MoneyDirection.Out
  })
})
const hasDebtPlus = computed(() => {
  return props.ticket.paymentList?.some((i) => {
    return i.debtAmount > 0
  })
})
const hasDebtMinus = computed(() => {
  return props.ticket.paymentList?.some((i) => {
    return i.debtAmount < 0
  })
})
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
            <th>Tiền thu</th>
            <th v-if="hasPaymentOut">Tiền chi</th>
            <th v-if="CONFIG.MODE === 'development' || hasDebtPlus">Ghi nợ</th>
            <th v-if="CONFIG.MODE === 'development' || hasDebtMinus">Trừ nợ</th>
            <th v-if="CONFIG.MODE === 'development' || hasDebtPlus || hasDebtMinus">Nợ hiện tại</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(payment, index) in ticket.paymentList" :key="index">
            <td v-if="CONFIG.MODE === 'development'" style="color: violet" class="text-center">
              {{ payment.id }}
            </td>
            <td class="text-center">{{ index + 1 }}</td>
            <td class="">
              <div>{{ timeToText(payment.createdAt, 'DD/MM/YY hh:mm') }}</div>
              <div style="font-size: 0.9em; font-style: italic">
                {{ paymentMethodMap[payment.paymentMethodId]?.name }}
              </div>
            </td>
            <td>
              <div>{{ PaymentActionTypeText[payment.paymentActionType] }}</div>
              <div v-if="payment.note" style="font-size: 0.9em">
                {{ payment.note }}
              </div>
            </td>
            <td>
              <div v-if="payment.moneyDirection === MoneyDirection.In" class="flex justify-end">
                {{ formatMoney(payment.paidAmount) }}
              </div>
            </td>
            <td v-if="hasPaymentOut">
              <div v-if="payment.moneyDirection === MoneyDirection.Out" class="flex justify-end">
                {{ formatMoney(payment.paidAmount) }}
              </div>
            </td>
            <td class="text-right" v-if="CONFIG.MODE === 'development' || hasDebtPlus">
              <span v-if="payment.debtAmount > 0">
                {{ formatMoney(payment.debtAmount) }}
              </span>
            </td>
            <td class="text-right" v-if="CONFIG.MODE === 'development' || hasDebtMinus">
              <span v-if="payment.debtAmount < 0">
                {{ formatMoney(payment.debtAmount) }}
              </span>
            </td>
            <td
              class="text-right"
              v-if="CONFIG.MODE === 'development' || hasDebtPlus || hasDebtMinus"
            >
              {{ formatMoney(payment.openDebt) }} ->
              {{ formatMoney(payment.closeDebt) }}
            </td>
          </tr>
          <tr>
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="3" class="text-right">Tổng đã thanh toán :</td>
            <td colspan="1" class="text-right font-bold">{{ formatMoney(ticket.paid) }}</td>
            <td v-if="hasPaymentOut"></td>
            <td v-if="CONFIG.MODE === 'development' || hasDebtPlus"></td>
            <td v-if="CONFIG.MODE === 'development' || hasDebtMinus"></td>
            <td v-if="CONFIG.MODE === 'development' || hasDebtPlus || hasDebtMinus"></td>
          </tr>
          <tr v-if="ticket.debt >= 0">
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="3" class="text-right font-bold">Đang thiếu :</td>
            <td colspan="1" class="text-right font-bold">{{ formatMoney(ticket.debt) }}</td>
            <td v-if="hasPaymentOut"></td>
            <td v-if="CONFIG.MODE === 'development' || hasDebtPlus"></td>
            <td v-if="CONFIG.MODE === 'development' || hasDebtMinus"></td>
            <td v-if="CONFIG.MODE === 'development' || hasDebtPlus || hasDebtMinus"></td>
          </tr>
          <tr v-else style="color: var(--text-green)">
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="3" class="text-right font-bold">Đang thừa</td>
            <td colspan="1" class="text-right font-bold">{{ formatMoney(-ticket.debt) }}</td>
            <td v-if="hasPaymentOut"></td>
            <td v-if="CONFIG.MODE === 'development' || hasDebtPlus"></td>
            <td v-if="CONFIG.MODE === 'development' || hasDebtMinus"></td>
            <td v-if="CONFIG.MODE === 'development' || hasDebtPlus || hasDebtMinus"></td>
            V
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
