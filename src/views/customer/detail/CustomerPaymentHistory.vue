<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import type { Customer } from '../../../modules/customer'
import { CustomerPaymentApi } from '../../../modules/customer-payment/customer-payment.api'
import type { CustomerPayment } from '../../../modules/customer-payment/customer-payment.model'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { DTimer } from '../../../utils'
import CustomerPaymentTypeTag from '../CustomerPaymentTypeTag.vue'
import ModalCustomerPayDebt from '../ModalCustomerPayDebt.vue'
import LinkAndStatusTicket from './LinkAndStatusTicket.vue'

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

const customerPaymentList = ref<CustomerPayment[]>([])
const page = ref(1)
const limit = ref(Number(localStorage.getItem('CUSTOMER_PAYMENTS_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const { data, meta } = await CustomerPaymentApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: { ticket: true },
      filter: { customerId: props.customerId },
      sort: { id: 'DESC' },
    })
    customerPaymentList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: CustomerPaymentsHistory.vue:33 ~ error:', error)
  }
}

watch(
  () => props.customerId,
  async (newValue) => {
    if (newValue) await startFetchData()
    else customerPaymentList.value = []
  },
  { immediate: true }
)

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('CUSTOMER_PAYMENTS_PAGINATION_LIMIT', String(options.limit))
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
      <div class="ml-auto">
        <VueButton
          v-if="permissionIdMap[PermissionId.CUSTOMER_PAY_DEBT]"
          color="blue"
          icon="dollar"
          @click="modalCustomerPayDebt?.openModal(customerId)">
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
          <tr v-if="customerPaymentList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(customerPayment, index) in customerPaymentList" :key="index">
            <td>
              <LinkAndStatusTicket :ticket="customerPayment.ticket!" />
              <div style="white-space: nowrap">
                {{ DTimer.timeToText(customerPayment.createdAt, 'hh:mm DD/MM/YYYY') }}
              </div>
              <div>
                <CustomerPaymentTypeTag :paymentType="customerPayment.paymentType" />
              </div>
              <div v-if="customerPayment.note">
                {{ customerPayment.note }}
              </div>
              <div v-if="customerPayment.description">
                {{ customerPayment.description }}
              </div>
            </td>
            <td class="text-right">
              <div class="flex justify-between item-center" style="white-space: nowrap">
                <span>T.Toán:</span>
                <span>{{ formatMoney(customerPayment.paid) }}</span>
              </div>
              <div class="flex justify-between item-center">
                <span>Ghi nợ:</span>
                <span>{{ formatMoney(customerPayment.debit) }}</span>
              </div>
              <div class="flex justify-between item-center">
                <span>Nợ:</span>
                <span>
                  {{ formatMoney(customerPayment.openDebt) }} ➞
                  {{ formatMoney(customerPayment.closeDebt) }}
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
            <th>Thanh toán</th>
            <th>Ghi nợ</th>
            <th>Công nợ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="customerPaymentList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(customerPayment, index) in customerPaymentList" :key="index">
            <td>
              <LinkAndStatusTicket
                :ticketId="customerPayment.ticketId"
                :ticket="customerPayment.ticket!" />
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ DTimer.timeToText(customerPayment.createdAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </td>
            <td class="px-4">
              <CustomerPaymentTypeTag :paymentType="customerPayment.paymentType" />
              <div v-if="customerPayment.description" style="font-size: 0.8rem">
                {{ customerPayment.description }}
              </div>
              <div v-if="customerPayment.note" style="font-size: 0.8rem">
                {{ customerPayment.note }}
              </div>
            </td>
            <td style="white-space: nowrap; text-align: right">
              {{ formatMoney(customerPayment.paid) }}
            </td>
            <td style="white-space: nowrap; text-align: right">
              {{ formatMoney(customerPayment.debit) }}
            </td>
            <td class="text-right">
              {{ formatMoney(customerPayment.openDebt) }} ➞
              {{ formatMoney(customerPayment.closeDebt) }}
            </td>
          </tr>
        </tbody>
      </table>
      <div class="mt-4 mb-2 flex justify-end">
        <a-pagination
          v-model:current="page"
          v-model:pageSize="limit"
          :total="total"
          show-size-changer
          @change="
            (page: number, pageSize: number) => changePagination({ page, limit: pageSize })
          " />
      </div>
    </div>
  </div>
  <ModalCustomerPayDebt ref="modalCustomerPayDebt" @success="handleModalCustomerPayDebtSuccess" />
</template>
