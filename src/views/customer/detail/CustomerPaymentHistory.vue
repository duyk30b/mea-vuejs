<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import VuePagination from '../../../common/VuePagination.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { type Customer } from '../../../modules/customer'
import { PaymentApi } from '../../../modules/payment/payment.api'
import { Payment, PersonType } from '../../../modules/payment/payment.model'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { ESTimer } from '../../../utils'
import PaymentTimingTag from '../../payment/PaymentTimingTag.vue'
import ModalCustomerPayDebt from '../ModalCustomerPayDebt.vue'
import LinkAndStatusTicket from '../../ticket-base/LinkAndStatusTicket.vue'

const modalCustomerPayDebt = ref<InstanceType<typeof ModalCustomerPayDebt>>()

const emit = defineEmits<{ (e: 'update_customer', value: Customer): void }>()

const props = withDefaults(defineProps<{ customerId: number }>(), {
  customerId: 0,
})

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const paymentList = ref<Payment[]>([])
const page = ref(1)
const limit = ref(Number(localStorage.getItem('PAYMENT_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const paginationResponse = await PaymentApi.pagination({
      relation: { ticket: true, paymentMethod: true },
      page: page.value,
      limit: limit.value,
      filter: {
        personId: props.customerId,
        personType: PersonType.Customer,
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
    localStorage.setItem('PAYMENT_PAGINATION_LIMIT', String(options.limit))
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
          v-if="permissionIdMap[PermissionId.PAYMENT_CUSTOMER_MONEY_IN]"
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
            <th>Hóa đơn</th>
            <th>Tiền</th>
          </tr>
        </thead>
        <tbody style="font-size: 0.8rem">
          <tr v-if="paymentList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(payment, index) in paymentList" :key="index">
            <td>
              <LinkAndStatusTicket :ticket="payment.ticket!" :ticketId="payment.voucherId" />
              <div style="white-space: nowrap">
                {{ ESTimer.timeToText(payment.createdAt, 'hh:mm DD/MM/YYYY') }}
              </div>
              <div>
                <PaymentTimingTag :paymentTiming="payment.paymentTiming" />
              </div>
              <div v-if="payment.note">
                {{ payment.note }}
              </div>
              <div v-if="payment.description">
                {{ payment.description }}
              </div>
            </td>
            <td class="text-right">
              <div class="flex justify-between item-center" style="white-space: nowrap">
                <span>T.Toán:</span>
                <span>{{ formatMoney(payment.paidAmount) }}</span>
              </div>
              <div class="flex justify-between item-center">
                <span>Ghi nợ:</span>
                <span>{{ formatMoney(payment.debtAmount) }}</span>
              </div>
              <div class="flex justify-between item-center">
                <span>Nợ:</span>
                <span>
                  {{ formatMoney(payment.openDebt) }} ➞
                  {{ formatMoney(payment.closeDebt) }}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <table v-if="!isMobile">
        <thead>
          <tr>
            <th>Hóa đơn</th>
            <th>Loại</th>
            <th>Số tiền</th>
            <th>Ghi nợ</th>
            <th>Công nợ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paymentList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(payment, index) in paymentList" :key="index">
            <td>
              <LinkAndStatusTicket :ticketId="payment.voucherId" :ticket="payment.ticket!" />
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ ESTimer.timeToText(payment.createdAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </td>
            <td class="px-4">
              <PaymentTimingTag :paymentTiming="payment.paymentTiming" />
              <div style="font-size: 0.8rem; color: #555">
                {{ payment.paymentMethod?.name }}
              </div>
              <div v-if="payment.description" style="font-size: 0.8rem">
                {{ payment.description }}
              </div>
              <div v-if="payment.note" style="font-size: 0.8rem">
                {{ payment.note }}
              </div>
            </td>
            <td style="white-space: nowrap; text-align: right">
              {{ formatMoney(payment.paidAmount) }}
            </td>
            <td style="white-space: nowrap; text-align: right">
              {{ formatMoney(payment.debtAmount) }}
            </td>
            <td class="text-right">
              {{ formatMoney(payment.openDebt) }} ➞
              {{ formatMoney(payment.closeDebt) }}
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
