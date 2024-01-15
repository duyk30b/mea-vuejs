<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Customer, CustomerPayment, CustomerPaymentService } from '../../../modules/customer'
import { PaymentType } from '../../../modules/enum'
import { useOrganizationStore } from '../../../store/organization.store'
import { timeToText } from '../../../utils'
import CustomerPaymentTypeTag from '../CustomerPaymentTypeTag.vue'

const props = withDefaults(defineProps<{ customer: Customer }>(), {
  customer: () => Customer.blank(),
})

const router = useRouter()

const organizationStore = useOrganizationStore()
const { formatMoney, isMobile } = organizationStore

const customerPaymentList = ref<CustomerPayment[]>([])
const page = ref(1)
const limit = ref(Number(localStorage.getItem('CUSTOMER_PAYMENTS_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const data = await CustomerPaymentService.pagination({
      page: page.value,
      limit: limit.value,
      filter: { customerId: props.customer.id! },
      sort: { id: 'DESC' },
    })
    customerPaymentList.value = data.data
    total.value = data.total
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

defineExpose({ startFetchData })
</script>

<template>
  <div class="mt-4 w-full">
    <table v-if="isMobile" class="table-mobile">
      <thead>
        <tr>
          <th>Hóa đơn</th>
          <th>Tiền</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="customerPaymentList.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="(customerPayment, index) in customerPaymentList" :key="index">
          <td>
            <div v-if="customerPayment.invoiceId">
              <a @click="openBlankInvoiceDetail(customerPayment.invoiceId)">
                IV{{ customerPayment.invoiceId }}
              </a>
            </div>
            <div style="font-size: 0.8rem; white-space: nowrap">
              {{ timeToText(customerPayment.time, 'hh:mm DD/MM/YYYY') }}
            </div>
            <div>
              <CustomerPaymentTypeTag :type="customerPayment.type" />
            </div>
            <div v-if="customerPayment.note" style="font-size: 0.8rem">
              {{ customerPayment.note }}
            </div>
            <div v-if="customerPayment.description" style="font-size: 0.8rem">
              {{ customerPayment.description }}
            </div>
          </td>
          <td class="text-right">
            <div class="flex justify-between item-center" style="white-space: nowrap">
              <span style="font-size: 0.8rem"> TT: </span>
              <span>{{ formatMoney(customerPayment.paid) }}</span>
            </div>
            <div v-if="customerPayment.debit != 0" style="white-space: nowrap">
              <div class="flex justify-between item-center">
                <div style="font-size: 0.8rem">
                  <span v-if="customerPayment.type === PaymentType.ImmediatePayment">Ghi nợ:</span>
                  <span v-if="customerPayment.type === PaymentType.ReceiveRefund">Hoàn nợ:</span>
                  <span v-if="customerPayment.type === PaymentType.PayDebt">Trừ nợ:</span>
                </div>
                <span>{{ formatMoney(customerPayment.debit) }}</span>
              </div>
              <div class="flex justify-between item-center">
                <span style="font-size: 0.8rem"> Nợ cuối kỳ: </span>
                <span>{{ formatMoney(customerPayment.customerCloseDebt) }}</span>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <table v-else class="table-mobile">
      <thead>
        <tr>
          <th>Hóa đơn</th>
          <th>Loại</th>
          <th>Thanh toán</th>
          <th>Công nợ</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="customerPaymentList.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="(customerPayment, index) in customerPaymentList" :key="index">
          <td>
            <div v-if="customerPayment.invoiceId">
              <a @click="openBlankInvoiceDetail(customerPayment.invoiceId)">
                IV{{ customerPayment.invoiceId }}
              </a>
            </div>
            <div style="font-size: 0.8rem; white-space: nowrap">
              {{ timeToText(customerPayment.time, 'hh:mm DD/MM/YYYY') }}
            </div>

            <div v-if="customerPayment.note" style="font-size: 0.8rem">
              {{ customerPayment.note }}
            </div>
          </td>
          <td class="px-4">
            <CustomerPaymentTypeTag :type="customerPayment.type" />
            <div v-if="customerPayment.description" style="font-size: 0.8rem">
              {{ customerPayment.description }}
            </div>
          </td>
          <td style="white-space: nowrap; text-align: right">
            {{ formatMoney(customerPayment.paid) }}
          </td>
          <td class="text-right">
            <div v-if="customerPayment.debit != 0" style="white-space: nowrap">
              <div class="flex justify-between">
                <div style="font-size: 0.8rem">
                  <span v-if="customerPayment.type === PaymentType.ImmediatePayment">Ghi nợ:</span>
                  <span v-if="customerPayment.type === PaymentType.ReceiveRefund">Hoàn nợ:</span>
                  <span v-if="customerPayment.type === PaymentType.PayDebt">Trừ nợ:</span>
                </div>
                <span>{{ formatMoney(customerPayment.debit) }}</span>
              </div>
              <div class="flex justify-between">
                <span style="font-size: 0.8rem"> Nợ cuối kỳ: </span>
                <span>{{ formatMoney(customerPayment.customerCloseDebt) }}</span>
              </div>
            </div>
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
