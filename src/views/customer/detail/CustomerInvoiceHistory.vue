<script setup lang="ts">
import { Customer } from '@/modules/customer'
import { InvoiceService, InvoiceStatus, type Invoice } from '@/modules/invoice'
import { useOrganizationStore } from '@/store/organization.store'
import { formatPhone, timeToText } from '@/utils'
import InvoiceStatusTag from '@/views/invoice/InvoiceStatusTag.vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = withDefaults(defineProps<{ customer: Customer }>(), {
  customer: () => Customer.blank(),
})
const router = useRouter()

const organizationStore = useOrganizationStore()
const { formatMoney, isMobile } = organizationStore

const invoices = ref<Invoice[]>([])
const page = ref(1)
const limit = ref(Number(localStorage.getItem('CUSTOMER_INVOICE_HISTORY_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const data = await InvoiceService.pagination({
      page: page.value,
      limit: limit.value,
      filter: { customerId: props.customer.id! },
      relation: { customer: false },
      sort: { id: 'DESC' },
    })
    invoices.value = data.data
    total.value = data.total
  } catch (error) {
    console.log('🚀 ~ file: CustomerInvoicesHistory.vue:33 ~ error:', error)
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('CUSTOMER_INVOICE_HISTORY_PAGINATION_LIMIT', String(options.limit))
  }
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

const openBlankInvoiceDetail = (invoiceId: number) => {
  let route = router.resolve({
    name: 'InvoiceDetail',
    params: { id: invoiceId },
  })
  window.open(route.href, '_blank')
}

const openBlankInvoiceUpsert = (customerId: number) => {
  let route = router.resolve({
    name: 'InvoiceUpsert',
    query: { customer_id: customerId, mode: 'CREATE' },
  })
  window.open(route.href, '_blank')
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center">
      <div class="flex flex-wrap">
        <span class="mr-2"
          >KH: <b>{{ customer.fullName }}</b></span
        >
        <span>
          <a :href="'tel:' + customer.phone"> {{ formatPhone(customer.phone || '') }} </a>
        </span>
      </div>
      <div>
        <a-button type="primary" @click="openBlankInvoiceUpsert(customer.id)">
          <template #icon>
            <PlusOutlined />
          </template>
          HĐ mới
        </a-button>
      </div>
    </div>
    <div class="mt-4 w-full">
      <table v-if="isMobile" class="table-mobile">
        <thead>
          <tr>
            <th>Đơn hàng</th>
            <th>Tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="invoices.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(invoice, index) in invoices" :key="index">
            <td>
              <div>
                <a @click="openBlankInvoiceDetail(invoice.id)"> IV{{ invoice.id }} </a>
                <span class="ml-2">
                  <InvoiceStatusTag :status="invoice?.status" />
                </span>
              </div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(invoice.time, 'hh:mm DD/MM/YYYY') }}
              </div>
            </td>
            <td class="text-right">
              <div style="font-weight: 500">
                {{ formatMoney(invoice.revenue) }}
              </div>
              <div v-if="invoice.status === InvoiceStatus.Debt" class="text-xs">
                Nợ: {{ formatMoney(invoice.debt) }}
              </div>
              <div v-if="invoice.status === InvoiceStatus.AwaitingShipment" class="text-xs">
                Đã thanh toán: {{ formatMoney(invoice.paid) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <table v-else class="table-mobile">
        <thead>
          <tr>
            <th>Đơn hàng</th>
            <th>Trạng thái</th>
            <th>Tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="invoices.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(invoice, index) in invoices" :key="index">
            <td>
              <div>
                <a @click="openBlankInvoiceDetail(invoice.id)"> IV{{ invoice.id }} </a>
              </div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(invoice.time, 'hh:mm DD/MM/YYYY') }}
              </div>
            </td>
            <td>
              <InvoiceStatusTag :status="invoice?.status" />
            </td>
            <td class="text-right">
              <div style="font-weight: 500">
                {{ formatMoney(invoice.revenue) }}
              </div>
              <div v-if="invoice.status === InvoiceStatus.Debt" class="text-xs">
                Nợ: {{ formatMoney(invoice.debt) }}
              </div>
              <div v-if="invoice.status === InvoiceStatus.AwaitingShipment" class="text-xs">
                Đã thanh toán: {{ formatMoney(invoice.paid) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="mt-4 float-right mb-2">
        <a-pagination
          v-model:current="page"
          v-model:pageSize="limit"
          :total="total"
          show-size-changer
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })"
        />
      </div>
    </div>
  </div>
</template>
