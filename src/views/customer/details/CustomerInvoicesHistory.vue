<script setup lang="ts">
import { Customer } from '@/modules/customer'
import { PaymentStatus, PaymentStatusText } from '@/modules/enum'
import { InvoiceService, type Invoice } from '@/modules/invoice'
import { formatNumber, timeToText } from '@/utils'
import { CheckCircleOutlined, ExclamationCircleOutlined, PlusOutlined, StopOutlined } from '@ant-design/icons-vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{ customer: Customer }>(),
  { customer: () => Customer.blank() }
)

const router = useRouter()

const invoices = ref<Invoice[]>([])
const page = ref(1)
const limit = ref(5)
const total = ref(0)

const startFetchData = async () => {
  try {
    const data = await InvoiceService.pagination({
      page: page.value,
      limit: limit.value,
      filter: { customer_id: props.customer.id! },
      relations: { customer: false },
      sort: { id: 'DESC' },
    })
    invoices.value = data.data
    total.value = data.total
  } catch (error) {
    console.log('🚀 ~ file: CustomerInvoicesHistory.vue:33 ~ error:', error)
  }
}

const changePagination = async (options: { page?: number, limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit
  await startFetchData()
}

watch(
  () => props.customer.id,
  async (newValue) => {
    if (newValue) await startFetchData()
    else invoices.value = []
  },
  { immediate: true }
)

const openBlankArrivalInvoiceDetail = (i: Invoice) => {
  let route = router.resolve({
    name: 'ArrivalInvoiceDetail',
    params: { id: i.arrivalId },
    query: { invoice_id: i.id },
  })
  window.open(route.href, '_blank')
}

const openBlankArrivalInvoiceUpsert = (customerId: number) => {
  let route = router.resolve({
    name: 'ArrivalInvoiceUpsert',
    query: { customer_id: customerId },
  })
  window.open(route.href, '_blank')
}
</script>

<template>
  <div>
    <div class="flex justify-between items-end">
      <div>
        Khách hàng: <b>{{ customer.fullNameVi }}</b> - {{ customer.phone }}
      </div>
      <div>
        <a-button type="primary" @click="openBlankArrivalInvoiceUpsert(customer.id)">
          <template #icon>
            <PlusOutlined />
          </template>
          Tiếp đón nhanh
        </a-button>
      </div>
    </div>
    <div class="table-wrapper mt-4 w-full">
      <table class="table">
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Tổng Tiền</th>
            <th>Trạng thái</th>
            <th>Mã ĐH</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="invoices.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(invoice, index) in invoices" :key="index">
            <td class="text-center">{{ timeToText(invoice.paymentTime, 'hh:mm DD/MM/YYYY') }}</td>
            <td class="text-right">
              <div style="font-weight: 500;">{{ formatNumber(invoice.totalMoney) }}</div>
              <div v-if="invoice.debt"><i><small>Nợ: {{ formatNumber(invoice.debt) }}</small></i></div>
            </td>
            <td class="text-center">
              <a-tag v-if="invoice.paymentStatus === PaymentStatus.Full" color="success">
                <template #icon>
                  <CheckCircleOutlined />
                </template>
                {{ PaymentStatusText[PaymentStatus.Full] }}
              </a-tag>
              <a-tag v-if="invoice.paymentStatus === PaymentStatus.Unpaid" color="warning">
                <template #icon>
                  <ExclamationCircleOutlined />
                </template>
                {{ PaymentStatusText[PaymentStatus.Unpaid] }}
              </a-tag>
              <a-tag v-if="invoice.paymentStatus === PaymentStatus.Refund" color="error">
                <template #icon>
                  <StopOutlined />
                </template>
                {{ PaymentStatusText[PaymentStatus.Refund] }}
              </a-tag>
            </td>
            <td class="text-center">
              <a @click="openBlankArrivalInvoiceDetail(invoice)"> IV{{ invoice.id }} </a>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="mt-4 float-right mb-2">
        <a-pagination v-model:current="page" v-model:pageSize="limit" :total="total"
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })" />
      </div>
    </div>
  </div>
</template>
