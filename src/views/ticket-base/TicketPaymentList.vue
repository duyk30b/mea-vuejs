<script setup lang="ts">
import { useSettingStore } from '../../modules/_me/setting.store'
import { PaymentMethod } from '../../modules/payment-method'
import { Ticket } from '../../modules/ticket'
import { timeToText } from '../../utils'
import CustomerPaymentTypeTag from '../customer/CustomerPaymentTypeTag.vue'

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
            <th>PTTT</th>
            <th>Loại</th>
            <th>Số tiền</th>
            <th>Ghi nợ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(customerPayment, index) in ticket.customerPaymentList" :key="index">
            <td class="text-center">
              {{ index + 1 }}
            </td>
            <td class="text-left">
              <div>
                {{ timeToText(customerPayment.createdAt, 'DD/MM/YY hh:mm') }}
              </div>
              <div v-if="customerPayment.note" style="font-size: 0.8rem">
                {{ customerPayment.note }}
              </div>
              <div v-if="customerPayment.description" style="font-size: 0.8rem; font-style: italic">
                {{ customerPayment.description }}
              </div>
            </td>
            <td>{{ paymentMethodMap[customerPayment.paymentMethodId]?.name || '' }}</td>
            <td>
              <CustomerPaymentTypeTag :paymentType="customerPayment.paymentType" />
            </td>
            <td class="text-right">
              <div>{{ formatMoney(customerPayment.paid) }}</div>
            </td>
            <td class="text-right">
              <div>{{ formatMoney(customerPayment.debit) }}</div>
            </td>
          </tr>
          <tr>
            <td colspan="4" class="text-right">Tổng đã thanh toán :</td>
            <td class="text-right font-bold">{{ formatMoney(ticket.paid) }}</td>
            <td></td>
          </tr>
          <tr>
            <td colspan="4" class="text-right">
              <span v-if="ticket.paid > ticket.totalMoney">Đang thừa :</span>
              <span v-else-if="ticket.paid <= ticket.totalMoney">Đang thiếu :</span>
            </td>
            <td></td>
            <td class="text-right font-bold">{{ formatMoney(Math.abs(ticket.debt)) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
