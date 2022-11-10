<script setup lang="ts">
import { Customer } from '@/modules/customer'
import { InvoiceItemType, PaymentStatus, PaymentStatusText } from '@/modules/enum'
import { InvoiceItem, InvoiceItemService, InvoiceService, type Invoice } from '@/modules/invoice'
import { formatNumber, timeToText } from '@/utils'
import { CheckCircleOutlined, ExclamationCircleOutlined, PlusOutlined, StopOutlined } from '@ant-design/icons-vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{ customer: Customer }>(),
  { customer: () => Customer.blank() }
)

const router = useRouter()

const invoiceItems = ref<InvoiceItem[]>([])
const page = ref(1)
const limit = ref(5)
const total = ref(0)

const startFetchData = async () => {
  try {
    const data = await InvoiceItemService.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        customer_id: props.customer.id!,
        type: InvoiceItemType.Procedure,
      },
      relations: {
        procedure: true,
        invoice: { customer: false },
      },
      sort: { id: 'DESC' },
    })
    invoiceItems.value = data.data
    total.value = data.total
  } catch (error) {
    console.log('🚀 ~ file: CustomerProductHistory copy.vue:37 ~ error:', error)
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
    else invoiceItems.value = []
  },
  { immediate: true }
)

const openBlankArrivalInvoiceDetail = (data?: Invoice) => {
  if (!data) return
  let route = router.resolve({
    name: 'ArrivalInvoiceDetail',
    params: { id: data.arrivalId },
    query: { invoice_id: data.id },
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
      </div>
    </div>
    <div class="table-wrapper mt-4 w-full">
      <table class="table">
        <thead>
          <tr>
            <th>ĐH</th>
            <th>T.Gian</th>
            <th>T.Thái</th>
            <th>Dịch vụ</th>
            <th>S.Lượng</th>
            <th>Đ.Giá</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="invoiceItems.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(ii, index) in invoiceItems" :key="index">
            <td class="text-center">
              <a @click="openBlankArrivalInvoiceDetail(ii.invoice)"> IV{{ ii.id }} </a>
            </td>
            <td class="text-center">
              {{ timeToText(ii.invoice?.refundTime || ii.invoice?.paymentTime, 'hh:mm DD/MM/YYYY') }}
            </td>
            <td class="text-center">
              <a-tag v-if="ii.invoice?.paymentStatus === PaymentStatus.Full" color="success">
                <template #icon>
                  <CheckCircleOutlined />
                </template>
                {{ PaymentStatusText[PaymentStatus.Full] }}
              </a-tag>
              <a-tag v-if="ii.invoice?.paymentStatus === PaymentStatus.Unpaid" color="warning">
                <template #icon>
                  <ExclamationCircleOutlined />
                </template>
                {{ PaymentStatusText[PaymentStatus.Unpaid] }}
              </a-tag>
              <a-tag v-if="ii.invoice?.paymentStatus === PaymentStatus.Refund" color="error">
                <template #icon>
                  <StopOutlined />
                </template>
                {{ PaymentStatusText[PaymentStatus.Refund] }}
              </a-tag>
            </td>
            <td>{{ ii.procedure?.nameVi }}</td>
            <td class="text-center">{{ ii.quantity }}</td>
            <td>{{ formatNumber(ii.actualPrice) }}</td>
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
