<script setup lang="ts">
import { IconPrint } from '@/common/icon-antd'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Customer } from '@/modules/customer'
import { Payment } from '@/modules/payment/payment.model'
import { PaymentTicket } from '@/modules/payment_ticket'
import { PaymentTicketService } from '@/modules/payment_ticket/payment_ticket.service'
import { TemplateHtmlAction } from '@/modules/template-html'
import { Ticket } from '@/modules/ticket'
import { TicketActionType, TicketActionTypeText } from '@/modules/ticket/ticket.type'
import { WalletService } from '@/modules/wallet'
import { ESTimer } from '@/utils'
import { BugDevelopment } from '@/views/component'
import { ref, watch } from 'vue'
import { onMounted } from 'vue'

const props = defineProps<{
  ticket: Ticket
}>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const walletMap = WalletService.walletMap
const paymentMap = ref<Record<string, { payment: Payment; paymentTicketList: PaymentTicket[] }>>({}) // key là paymentId

watch(
  () => props.ticket.paymentTicketList,
  (newValue) => {
    paymentMap.value = {}
    ;(newValue || []).forEach((paymentTicket) => {
      if (!paymentTicket.payment) return
      if (!paymentMap.value[paymentTicket.paymentId]) {
        paymentMap.value[paymentTicket.paymentId] = {
          payment: Payment.from(paymentTicket.payment),
          paymentTicketList: [],
        }
      }
      paymentMap.value[paymentTicket.paymentId].paymentTicketList.push(
        PaymentTicket.from(paymentTicket),
      )
    })
  },
  { immediate: true, deep: true },
)

onMounted(async () => {
  try {
    await WalletService.getAll()
  } catch (error) {
    console.log('🚀 ~ TableTicketPaidItemHistory.vue:22 ~ error:', error)
  }
})

const startPrintPayment = async (options: { paymentId: string }) => {
  const payment = Payment.from(paymentMap.value[options.paymentId].payment)
  payment.customer = Customer.from(props.ticket.customer)
  payment.paymentTicketList = PaymentTicket.fromList(
    paymentMap.value[options.paymentId].paymentTicketList,
  )
  await PaymentTicketService.refreshRelation(payment.paymentTicketList)
  await TemplateHtmlAction.startPrintCustomerPayment({
    payment,
  })
}
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
            <th v-if="CONFIG.MODE === 'development'"></th>
            <th>DV</th>
            <th>Tiền</th>
            <th>Ghi nợ</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <template
            v-for="({ payment, paymentTicketList }, paymentId, paymentIndex) in paymentMap"
            :key="paymentId"
          >
            <tr
              v-for="(paymentTicket, paymentTicketIndex) in paymentTicketList"
              :key="paymentTicket.id"
              style="border-bottom: 1px solid var(--border-color)"
            >
              <td
                :rowspan="paymentTicketList.length"
                v-if="paymentTicketIndex === 0"
                class="text-center"
              >
                {{ paymentIndex + 1 }}
              </td>
              <td :rowspan="paymentTicketList.length" v-if="paymentTicketIndex === 0">
                <div>{{ ESTimer.timeToText(payment.createdAt, 'DD/MM/YY hh:mm') }}</div>
                <div>{{ walletMap[payment.walletId]?.name }}</div>
                <div v-if="paymentTicketList.length > 1">
                  {{ formatMoney(payment.paidTotal) }}
                </div>
              </td>
              <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
                <BugDevelopment :data="{ paymentTicket }" />
              </td>
              <td>
                <template
                  v-if="
                    [TicketActionType.PaymentItem, TicketActionType.RefundItem].includes(
                      paymentTicket.ticketActionType,
                    )
                  "
                >
                  <div>
                    <span>{{ paymentTicket.interactName }}</span>
                    <span
                      v-if="paymentTicket.sessionIndex"
                      style="margin-left: 4px; font-weight: 500"
                    >
                      (Buổi {{ paymentTicket.sessionIndex }})
                    </span>
                    <span
                      v-if="paymentTicket.ticketActionType === TicketActionType.RefundItem"
                      style="margin-left: 4px; font-weight: 500; color: var(--text-red)"
                    >
                      (Hoàn tiền)
                    </span>
                  </div>
                </template>
                <template v-else>
                  <div>{{ TicketActionTypeText[paymentTicket.ticketActionType] }}</div>
                </template>
                <div v-if="paymentTicket.payment.note" style="font-size: 0.9em">
                  {{ paymentTicket.payment.note }}
                </div>
              </td>
              <td class="text-right" style="padding-right: 8px">
                <div>{{ formatMoney(paymentTicket.paidMoney) }}</div>
              </td>
              <td
                :rowspan="paymentTicketList.length"
                v-if="paymentTicketIndex === 0"
                class="text-right"
                style="padding-right: 8px"
              >
                <div>{{ formatMoney(payment.debtTotal) }}</div>
              </td>
              <td
                :rowspan="paymentTicketList.length"
                v-if="paymentTicketIndex === 0"
                class="text-center"
              >
                <IconPrint
                  style="font-size: 18px; color: var(--text-blue); cursor: pointer"
                  @click="startPrintPayment({ paymentId: payment.id })"
                />
              </td>
            </tr>
          </template>

          <tr>
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="3" class="text-right">Đã thanh toán :</td>
            <td class="text-right font-bold">{{ formatMoney(ticket.paidTotal) }}</td>
            <td></td>
            <td></td>
          </tr>
          <tr v-if="ticket.debtTotal" style="color: var(--text-red)">
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="3" class="text-right">Đang nợ :</td>
            <td></td>
            <td class="text-right font-bold">{{ formatMoney(ticket.debtTotal) }}</td>
            <td></td>
          </tr>
          <tr
            v-if="ticket.paidTotal + ticket.debtTotal > ticket.totalMoney"
            style="color: var(--text-green)"
          >
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="3" class="text-right">Đang thừa</td>
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
            <td colspan="3" class="text-right">Đang thiếu :</td>
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
