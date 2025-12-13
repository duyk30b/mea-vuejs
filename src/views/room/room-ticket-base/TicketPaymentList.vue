<script setup lang="ts">
import { IconBug } from '@/common/icon-antd'
import { VueTooltip } from '@/common/popover'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { PaymentActionTypeText } from '@/modules/payment'
import { Ticket } from '@/modules/ticket'
import { WalletService } from '@/modules/wallet'
import { timeToText } from '@/utils'
import { onMounted } from 'vue'

const props = defineProps<{
  ticket: Ticket
}>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const walletMap = WalletService.walletMap

onMounted(async () => {
  try {
    await WalletService.getAll()
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
            <th v-if="CONFIG.MODE === 'development'"></th>
            <th>#</th>
            <th>Thời gian</th>
            <th>PT Thanh toán</th>
            <th>Note</th>
            <th>Tiền</th>
            <th v-if="CONFIG.MODE === 'development'">Ghi nợ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(payment, index) in ticket.paymentList" :key="index">
            <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
              <VueTooltip>
                <template #trigger>
                  <IconBug width="1.2em" height="1.2em" />
                </template>
                <div style="max-height: 600px; max-width: 800px; overflow-y: scroll">
                  <pre>{{ JSON.stringify(payment, null, 4) }}</pre>
                </div>
              </VueTooltip>
            </td>
            <td class="text-center">{{ index + 1 }}</td>
            <td class="">
              {{ timeToText(payment.createdAt, 'DD/MM/YY hh:mm') }}
            </td>
            <td class="text-left">
              <div>{{ walletMap[payment.walletId]?.name }}</div>
              <div v-if="CONFIG.MODE === 'development'" style="color: violet">
                {{ formatMoney(payment.walletOpenMoney) }} ->
                {{ formatMoney(payment.walletCloseMoney) }}
              </div>
            </td>
            <td>
              <div>{{ PaymentActionTypeText[payment.paymentActionType] }}</div>
              <div v-if="payment.note" style="font-size: 0.9em">
                {{ payment.note }}
              </div>
            </td>
            <td class="text-right" style="padding-right: 8px">
              <div>{{ formatMoney(payment.paid + payment.paidItem) }}</div>
            </td>
            <td class="text-right" v-if="CONFIG.MODE === 'development'" style="color: violet">
              <div>{{ formatMoney(payment.debt + payment.debtItem) }}</div>
              <div>
                {{ formatMoney(payment.personOpenDebt) }} ->
                {{ formatMoney(payment.personCloseDebt) }}
              </div>
            </td>
          </tr>

          <tr>
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="4" class="text-right">Đã thanh toán :</td>
            <td class="text-right font-bold">{{ formatMoney(ticket.paidAmount) }}</td>
            <td v-if="CONFIG.MODE === 'development'"></td>
          </tr>
          <tr v-if="ticket.debtAmount" style="color: var(--text-red)">
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="4" class="text-right">Đang nợ :</td>
            <td class="text-right font-bold">{{ formatMoney(ticket.debtAmount) }}</td>
            <td v-if="CONFIG.MODE === 'development'"></td>
          </tr>
          <tr v-if="ticket.paidAmount > ticket.totalMoney" style="color: var(--text-green)">
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="4" class="text-right">Đang thừa</td>
            <td class="text-right font-bold">
              {{ formatMoney(ticket.paidAmount - ticket.totalMoney) }}
            </td>
            <td v-if="CONFIG.MODE === 'development'"></td>
          </tr>
          <tr v-else-if="ticket.debtAmount !== ticket.totalMoney - ticket.paidAmount">
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="4" class="text-right">Đang thiếu :</td>
            <td class="text-right font-bold" style="color: var(--text-red)">
              {{ formatMoney(ticket.totalMoney - ticket.paidAmount) }}
            </td>
            <td v-if="CONFIG.MODE === 'development'"></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
