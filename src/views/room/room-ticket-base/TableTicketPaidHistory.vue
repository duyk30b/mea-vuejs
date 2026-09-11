<script setup lang="ts">
import { IconPrint } from '@/common/icon-antd'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Customer } from '@/modules/customer'
import { PaymentApi } from '@/modules/payment/payment.api'
import { Payment } from '@/modules/payment/payment.model'
import { PaymentActionType, PaymentActionTypeText } from '@/modules/payment/payment.type'
import { PaymentTicketService } from '@/modules/payment_ticket/payment_ticket.service'
import { TemplateHtmlAction } from '@/modules/template-html'
import { Ticket } from '@/modules/ticket'
import { WalletService } from '@/modules/wallet'
import { ESTimer } from '@/utils'
import { BugDevelopment } from '@/views/component'
import { onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{ ticket: Ticket }>(), {
  ticket: () => Ticket.blank(),
})

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const walletMap = WalletService.walletMap
const paymentList = ref<Payment[]>([])

onMounted(async () => {
  try {
    await WalletService.getAll()
  } catch (error) {
    console.log('🚀 ~ TableTicketPaidHistory.vue:22 ~ error:', error)
  }
})

const startFetchData = async () => {
  try {
    console.log(
      '🚀 ~ TableTicketPaidHistory.vue:37 ~ startFetchData ~ paymentList.value:',
      paymentList.value,
    )
    paymentList.value = await PaymentApi.getListByTicketId(props.ticket.id)
  } catch (error) {
    console.log('🚀 ~ TableTicketPaidHistory.vue:32 ~ error:', error)
  }
}

const startPrintPayment = async (options: { payment: Payment }) => {
  const payment = Payment.from(options.payment)
  payment.customer = Customer.from(props.ticket.customer)
  await PaymentTicketService.refreshRelation(payment.paymentTicketList)
  await TemplateHtmlAction.startPrintCustomerPayment({
    payment,
  })
}

defineExpose({ startFetchData })
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

    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'"></th>
            <th>#</th>
            <th>Thời gian</th>
            <th>Ví</th>
            <th>HĐ</th>
            <th>Tiền</th>
            <th>Ghi nợ</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(payment, index) in paymentList || []" :key="index">
            <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
              <BugDevelopment :data="payment" />
            </td>
            <td class="text-center">{{ index + 1 }}</td>
            <td class="text-center">
              {{ ESTimer.timeToText(payment.createdAt, 'DD/MM/YY hh:mm') }}
            </td>
            <td class="text-left">
              <div>{{ walletMap[payment.walletId]?.name }}</div>
            </td>
            <td>
              <div>{{ PaymentActionTypeText[payment.paymentActionType] }}</div>
              <div v-if="payment.note" style="font-size: 0.9em">
                {{ payment.note }}
              </div>
            </td>
            <td class="text-right" style="padding-right: 8px">
              <div>{{ formatMoney(payment.paidTotal) }}</div>
            </td>
            <td class="text-right" style="padding-right: 8px">
              <div>{{ formatMoney(payment.debtTotal) }}</div>
            </td>
            <td class="text-center">
              <IconPrint
                v-if="[PaymentActionType.PaymentMoney].includes(payment.paymentActionType)"
                style="font-size: 18px; color: var(--text-blue); cursor: pointer"
                @click="startPrintPayment({ payment })"
              />
            </td>
          </tr>

          <tr>
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="4" class="text-right">Đã thanh toán :</td>
            <td class="text-right font-bold">{{ formatMoney(ticket.paidTotal) }}</td>
            <td></td>
            <td></td>
          </tr>
          <tr v-if="ticket.debtTotal" style="color: var(--text-red)">
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="4" class="text-right">Đang nợ :</td>
            <td></td>
            <td class="text-right font-bold">{{ formatMoney(ticket.debtTotal) }}</td>
            <td></td>
          </tr>
          <tr
            v-if="ticket.paidTotal + ticket.debtTotal > ticket.totalMoney"
            style="color: var(--text-green)"
          >
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="4" class="text-right">Đang thừa</td>
            <td class="text-right font-bold">
              {{ formatMoney(ticket.paidTotal + ticket.debtTotal - ticket.totalMoney) }}
            </td>
            <td></td>
            <td></td>
          </tr>
          <tr
            v-else-if="ticket.paidTotal + ticket.debtTotal < ticket.totalMoney"
            style="color: var(--text-red)"
          >
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="4" class="text-right">Chưa thanh toán :</td>
            <td class="text-right font-bold" style="color: var(--text-red)">
              {{ formatMoney(ticket.totalMoney - (ticket.paidTotal + ticket.debtTotal)) }}
            </td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
