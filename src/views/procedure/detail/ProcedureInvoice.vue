<script setup lang="ts">
import { InvoiceItem, InvoiceItemService, InvoiceItemType, InvoiceStatus } from '@/modules/invoice'
import { Procedure } from '@/modules/procedure'
import { useOrganizationStore } from '@/store/organization.store'
import { timeToText } from '@/utils'
import { CheckCircleOutlined, ExclamationCircleOutlined, StopOutlined } from '@ant-design/icons-vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{ procedure: Procedure }>(),
  { procedure: () => Procedure.blank() }
)

const router = useRouter()

const organizationStore = useOrganizationStore()
const { formatMoney } = organizationStore

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PROCEDURE_INVOICE_PAGINATION_LIMIT')) || 10)
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
    relation: { invoice: { customer: true } },
    sort: { id: 'DESC' },
  })
  invoiceItems.value = data.data
  total.value = data.total
}

const changePagination = async (options: { page?: number, limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('PROCEDURE_INVOICE_PAGINATION_LIMIT', String(options.limit))
  }
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

const openBlankInvoiceDetail = async (invoiceId: number) => {
  let route = router.resolve({
    name: 'InvoiceDetail',
    params: { id: invoiceId },
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
            <a @click="openBlankInvoiceDetail(invoiceItem.invoice!.id)"> IV{{ invoiceItem.invoiceId }} </a>
          </td>
          <td class="text-center"> {{ invoiceItem.invoice?.customer?.fullName }} </td>
          <td class="text-center"> {{ timeToText(invoiceItem.invoice?.paymentTime, "DD/MM/YYYY") }} </td>
          <td class="text-right"> {{ invoiceItem.quantity }}</td>
          <td class="text-right"> {{ formatMoney(invoiceItem.actualPrice) }}</td>
          <td class="text-right"> {{ formatMoney(invoiceItem.quantity * invoiceItem.actualPrice) }}</td>

          <td class="text-center">
            <a-tag v-if="invoiceItem.invoice?.status === InvoiceStatus.Draft" color="warning">
              <template #icon>
                <CheckCircleOutlined />
              </template>
              Nháp
            </a-tag>
            <a-tag v-if="invoiceItem.invoice?.status === InvoiceStatus.Process" color="processing">
              <template #icon>
                <CheckCircleOutlined />
              </template>
              Đang thực hiện
            </a-tag>
            <a-tag v-if="invoiceItem.invoice?.status === InvoiceStatus.Finish" color="success">
              <template #icon>
                <ExclamationCircleOutlined />
              </template>
              Hoàn thành
            </a-tag>
            <a-tag v-if="invoiceItem.invoice?.status === InvoiceStatus.Refund" color="error">
              <template #icon>
                <StopOutlined />
              </template>
              Hoàn trả
            </a-tag>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="mt-4 float-right mb-2">
      <a-pagination v-model:current="page" v-model:pageSize="limit" :total="total" show-size-changer
        @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })" />
    </div>
  </div>
</template>
