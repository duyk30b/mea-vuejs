<script setup lang="ts">
import { InvoiceItemType, PaymentStatus, PaymentStatusText } from '@/modules/enum'
import { Invoice, InvoiceItem, InvoiceItemService, InvoiceService } from '@/modules/invoice'
import { Procedure } from '@/modules/procedure'
import { formatNumber, timeToText } from '@/utils'
import { CheckCircleOutlined, ExclamationCircleOutlined, StopOutlined } from '@ant-design/icons-vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{ procedure: Procedure }>(),
  { procedure: () => Procedure.blank() }
)

const router = useRouter()

const page = ref(1)
const limit = ref(5)
const total = ref(0)
const invoiceItems = ref<InvoiceItem[]>([])

const startFetchData = async () => {
  const data = await InvoiceItemService.pagination({
    page: page.value,
    limit: limit.value,
    filter: {
      reference_id: props.procedure.id,
      type: InvoiceItemType.Procedure,
    },
    relations: { invoice: { customer: true } },
    sort: { id: 'DESC' },
  })
  invoiceItems.value = data.data
  total.value = data.total
}

const changePagination = async (options: { page?: number, limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit
  await startFetchData()
}

watch(
  () => props.procedure.id,
  async (newValue) => {
    if (newValue) await startFetchData()
    else invoiceItems.value = []
  },
  { immediate: true }
)

const openBlankInvoiceDetail = async (iv: Invoice) => {
  let route = router.resolve({
    name: 'ArrivalInvoiceDetail',
    params: { id: iv.arrivalId },
    query: { invoice_id: iv.id },
  })
  window.open(route.href, '_blank')
}

</script>

<template>
  <div class="table-wrapper">
    <table class="table">
      <thead>
        <tr>
          <th>Mã</th>
          <th>Phiếu</th>
          <th>KH</th>
          <th>Thời gian</th>
          <th>SL</th>
          <th>Giá</th>
          <th>T.Tiền</th>
          <th>T.Toán</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="invoiceItems.length === 0">
          <td colspan="20" class="text-center">No data</td>
        </tr>
        <tr v-for="(invoiceItem, index) in invoiceItems" :key="index">
          <td class="text-center">II{{ invoiceItem.id }}</td>
          <td class="text-center">
            <a @click="openBlankInvoiceDetail(invoiceItem.invoice!)"> IV{{ invoiceItem.invoiceId }} </a>
          </td>
          <td class="text-center"> {{ invoiceItem.invoice?.customer?.fullNameVi }} </td>
          <td class="text-center"> {{ timeToText(invoiceItem.invoice?.paymentTime, "DD/MM/YYYY") }} </td>
          <td class="text-right"> {{ invoiceItem.quantity }}</td>
          <td class="text-right"> {{ formatNumber(invoiceItem.actualPrice) }}</td>
          <td class="text-right"> {{ formatNumber(invoiceItem.quantity * invoiceItem.actualPrice) }}</td>

          <td class="text-center">
            <a-tag v-if="invoiceItem.invoice?.paymentStatus === PaymentStatus.Full" color="success">
              <template #icon>
                <CheckCircleOutlined />
              </template>
              {{ PaymentStatusText[PaymentStatus.Full] }}
            </a-tag>
            <a-tag v-if="invoiceItem.invoice?.paymentStatus === PaymentStatus.Unpaid" color="warning">
              <template #icon>
                <ExclamationCircleOutlined />
              </template>
              {{ PaymentStatusText[PaymentStatus.Unpaid] }}
            </a-tag>
            <a-tag v-if="invoiceItem.invoice?.paymentStatus === PaymentStatus.Refund" color="error">
              <template #icon>
                <StopOutlined />
              </template>
              {{ PaymentStatusText[PaymentStatus.Refund] }}
            </a-tag>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="mt-4 float-right mb-2">
      <a-pagination v-model:current="page" v-model:pageSize="limit" :total="total"
        @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })" />
    </div>
  </div>
</template>
