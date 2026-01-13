<script setup lang="ts">
import { IconBug } from '@/common/icon-antd'
import { VueTooltip } from '@/common/popover'
import VueButton from '@/common/VueButton.vue'
import VuePagination from '@/common/VuePagination.vue'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { type Customer } from '@/modules/customer'
import {
  MoneyDirection,
  Payment,
  PaymentActionTypeText,
  PaymentApi,
  PaymentPersonType,
  PaymentVoucherType,
} from '@/modules/payment'
import { PermissionId } from '@/modules/permission/permission.enum'
import { ESTimer } from '@/utils'
import TicketLink from '@/views/room/room-ticket-base/TicketLink.vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ModalCustomerPayDebt from '../ModalCustomerPayDebt.vue'

const modalCustomerPayDebt = ref<InstanceType<typeof ModalCustomerPayDebt>>()

const emit = defineEmits<{ (e: 'update_customer', value: Customer): void }>()

const props = withDefaults(defineProps<{ customerId: number }>(), {
  customerId: 0,
})

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

const paymentList = ref<Payment[]>([])
const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const paginationResponse = await PaymentApi.pagination({
      relation: { ticket: true, wallet: true },
      page: page.value,
      limit: limit.value,
      filter: {
        personId: props.customerId,
        personType: PaymentPersonType.Customer,
      },
      sort: { id: 'DESC' },
    })
    paymentList.value = paginationResponse.paymentList
    total.value = paginationResponse.total
  } catch (error) {
    console.log('🚀 ~ file: CustomerPaymentsHistory.vue:33 ~ error:', error)
  }
}

watch(
  () => props.customerId,
  async (newValue) => {
    if (newValue) await startFetchData()
    else paymentList.value = []
  },
  { immediate: true },
)

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
  }
  await startFetchData()
}

const handleModalCustomerPayDebtSuccess = async (data: { customer: Customer }) => {
  emit('update_customer', data.customer)
  await startFetchData()
}

defineExpose({ startFetchData })
</script>

<template>
  <div class="mt-4">
    <div class="flex flex-wrap items-center gap-2">
      <div style="margin-left: auto">
        <VueButton
          v-if="userPermission[PermissionId.TICKET_PAYMENT_MONEY]"
          color="blue"
          icon="dollar"
          @click="modalCustomerPayDebt?.openModal(customerId)"
        >
          Trả nợ
        </VueButton>
      </div>
    </div>

    <div class="mt-4 w-full table-wrapper">
      <table v-if="isMobile">
        <thead>
          <tr>
            <th style="width: 400px">Hóa đơn</th>
            <th>Tiền</th>
          </tr>
        </thead>
        <tbody style="">
          <tr v-if="paymentList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(payment, index) in paymentList" :key="index">
            <td>
              <TicketLink :ticket="payment.ticket!" :ticketId="payment.voucherId" />
              <div style="white-space: nowrap">
                {{ ESTimer.timeToText(payment.createdAt, 'hh:mm DD/MM/YYYY') }}
              </div>
              <div v-if="payment.note">
                {{ payment.note }}
              </div>
            </td>
            <td class="text-right">
              <div class="flex justify-between item-center" style="white-space: nowrap">
                <span>T.Toán:</span>
                <span>{{ formatMoney(payment.paidTotal) }}</span>
              </div>
              <div class="flex justify-between item-center">
                <span>Ghi nợ:</span>
                <span>{{ formatMoney(payment.debtTotal) }}</span>
              </div>
              <div class="flex justify-between item-center">
                <span>Nợ:</span>
                <span>
                  {{ formatMoney(payment.personOpenDebt) }} ➞
                  {{ formatMoney(payment.personCloseDebt) }}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <table v-if="!isMobile">
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'"></th>
            <th>Hóa đơn</th>
            <th>PT.Thanh Toán</th>
            <th>Note</th>
            <th>Tiền thu</th>
            <th>Ghi Nợ</th>
            <th>Nợ hiện tại</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paymentList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(payment, index) in paymentList" :key="index">
            <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
              <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
                <template #trigger>
                  <IconBug style="color: violet; cursor: pointer" width="1.2em" height="1.2em" />
                </template>
                <pre>{{ JSON.stringify(payment, null, 4) }}</pre>
              </VueTooltip>
            </td>
            <td>
              <TicketLink :ticketId="payment.voucherId" :ticket="payment.ticket!" target="_blank" />
              <div style="white-space: nowrap">
                {{ ESTimer.timeToText(payment.createdAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </td>
            <td class="text-center">
              {{ payment.wallet?.name }}
            </td>
            <td style="width: 300px">
              <div>{{ PaymentActionTypeText[payment.paymentActionType] }}</div>
              <div
                v-if="payment.note"
                style="
                  font-size: 0.9em;
                  max-width: 300px;
                  text-overflow: ellipsis;
                  overflow: hidden;
                "
              >
                {{ payment.note }}
              </div>
            </td>
            <td class="text-right">
              {{ formatMoney(payment.paidTotal) }}
            </td>
            <td style="white-space: nowrap; text-align: right">
              {{ formatMoney(payment.debtTotal) }}
            </td>
            <td class="text-right">
              <span>
                {{ formatMoney(payment.personOpenDebt) }} ➞
                {{ formatMoney(payment.personCloseDebt) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="p-4 flex flex-wrap justify-end gap-4">
        <VuePagination
          class="ml-auto"
          v-model:page="page"
          :total="total"
          :limit="limit"
          @update:page="(p: any) => changePagination({ page: p, limit })"
        />
      </div>
    </div>
  </div>
  <ModalCustomerPayDebt ref="modalCustomerPayDebt" @success="handleModalCustomerPayDebtSuccess" />
</template>
