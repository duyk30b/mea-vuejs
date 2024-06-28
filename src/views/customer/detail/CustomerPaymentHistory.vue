<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Customer } from '../../../modules/customer'
import { CustomerPaymentApi } from '../../../modules/customer-payment/customer-payment.api'
import type { CustomerPayment } from '../../../modules/customer-payment/customer-payment.model'
import { timeToText } from '../../../utils'
import CustomerPaymentTypeTag from '../CustomerPaymentTypeTag.vue'
import { VoucherType } from '../../../modules/enum'

const props = withDefaults(defineProps<{ customer: Customer }>(), {
  customer: () => Customer.blank(),
})

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const customerPaymentList = ref<CustomerPayment[]>([])
const page = ref(1)
const limit = ref(Number(localStorage.getItem('CUSTOMER_PAYMENTS_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const { data, meta } = await CustomerPaymentApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: { customerId: props.customer.id! },
      sort: { id: 'DESC' },
    })
    customerPaymentList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: CustomerPaymentsHistory.vue:33 ~ error:', error)
  }
}

watch(
  () => props.customer.id,
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

const openBlankInvoiceDetail = async (invoiceId: number) => {
  let route = router.resolve({
    name: 'InvoiceDetail',
    params: { id: invoiceId },
  })
  window.open(route.href, '_blank')
}

const openBlankVisitDetail = async (visitId: number) => {
  let route = router.resolve({
    name: 'VisitDetail',
    params: { id: visitId },
  })
  window.open(route.href, '_blank')
}

defineExpose({ startFetchData })
</script>

<template>
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
            <div v-if="customerPayment.voucherType === VoucherType.Invoice">
              <a @click="openBlankInvoiceDetail(customerPayment.voucherId)">
                IV{{ customerPayment.voucherId }}
              </a>
            </div>
            <div v-if="customerPayment.voucherType === VoucherType.Visit">
              <a @click="openBlankVisitDetail(customerPayment.voucherId)">
                VS{{ customerPayment.voucherId }}
              </a>
            </div>
            <div style="white-space: nowrap">
              {{ timeToText(customerPayment.createdAt, 'hh:mm DD/MM/YYYY') }}
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
              <span> T.Toán: </span>
              <span>{{ formatMoney(customerPayment.paid) }}</span>
            </div>
            <div class="flex justify-between item-center">
              <span> Ghi nợ: </span>
              <span>{{ formatMoney(customerPayment.debit) }}</span>
            </div>
            <div class="flex justify-between item-center">
              <span> Nợ: </span>
              <span>
                {{ formatMoney(customerPayment.openDebt) }} ➞
                {{ formatMoney(customerPayment.closeDebt) }}</span
              >
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
            <div v-if="customerPayment.voucherType === VoucherType.Invoice">
              <a @click="openBlankInvoiceDetail(customerPayment.voucherId)">
                IV{{ customerPayment.voucherId }}
              </a>
            </div>
            <div v-if="customerPayment.voucherType === VoucherType.Visit">
              <a @click="openBlankVisitDetail(customerPayment.voucherId)">
                VS{{ customerPayment.voucherId }}
              </a>
            </div>
            <div style="font-size: 0.8rem; white-space: nowrap">
              {{ timeToText(customerPayment.createdAt, 'hh:mm DD/MM/YYYY') }}
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
        @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })"
      />
    </div>
  </div>
</template>
