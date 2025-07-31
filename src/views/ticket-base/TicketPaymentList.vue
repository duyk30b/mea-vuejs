<script setup lang="ts">
import { CONFIG } from '@/config'
import { PaymentActionTypeText } from '@/modules/payment'
import { onMounted } from 'vue'
import { useSettingStore } from '../../modules/_me/setting.store'
import { PaymentMethodService } from '../../modules/payment-method'
import { Ticket } from '../../modules/ticket'
import { timeToText } from '../../utils'

defineProps<{
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
            <th>PT Thanh toán</th>
            <th>Note</th>
            <th>Số tiền</th>
            <th v-if="CONFIG.MODE === 'development'">Ghi nợ</th>
            <th v-if="CONFIG.MODE === 'development'">Nợ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(payment, index) in ticket.paymentList" :key="index">
            <td v-if="CONFIG.MODE === 'development'" style="color: violet" class="text-center">
              {{ payment.id }}
            </td>
            <td class="text-center">{{ index + 1 }}</td>
            <td class="text-center">
              {{ timeToText(payment.createdAt, 'DD/MM/YY hh:mm') }}
            </td>
            <td class="text-center">
              {{ paymentMethodMap[payment.paymentMethodId]?.name }}
            </td>
            <td>
              <div>{{ PaymentActionTypeText[payment.paymentActionType] }}</div>
              <div v-if="payment.note" style="font-size: 0.9em">
                {{ payment.note }}
              </div>
            </td>
            <td class="text-right">
              <div>{{ formatMoney(payment.paidAmount) }}</div>
            </td>
            <td class="text-right" v-if="CONFIG.MODE === 'development'" style="color: violet">
              {{ formatMoney(payment.debtAmount) }}
            </td>
            <td class="text-right" v-if="CONFIG.MODE === 'development'" style="color: violet">
              {{ formatMoney(payment.openDebt) }} ->
              {{ formatMoney(payment.closeDebt) }}
            </td>
          </tr>
          <tr>
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="4" class="text-right">Tổng đã thanh toán :</td>
            <td class="text-right font-bold">{{ formatMoney(ticket.paid) }}</td>
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td v-if="CONFIG.MODE === 'development'"></td>
          </tr>
          <tr v-if="ticket.debt >= 0">
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="4" class="text-right">Đang thiếu :</td>
            <td class="text-right font-bold">{{ formatMoney(ticket.debt) }}</td>
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td v-if="CONFIG.MODE === 'development'"></td>
          </tr>
          <tr v-else style="color: var(--text-green)">
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="4" class="text-right">Đang thừa</td>
            <td class="text-right font-bold">{{ formatMoney(-ticket.debt) }}</td>
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td v-if="CONFIG.MODE === 'development'"></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
