<script setup lang="ts">
import { InvoiceItem, InvoiceItemService, InvoiceItemType, InvoiceStatus } from '@/modules/invoice'
import { Procedure } from '@/modules/procedure'
import { useOrganizationStore } from '@/store/organization.store'
import { timeToText } from '@/utils'
import InvoiceStatusTag from '@/views/invoice/InvoiceStatusTag.vue'
import { CheckCircleOutlined, ExclamationCircleOutlined, StopOutlined } from '@ant-design/icons-vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = withDefaults(defineProps<{ procedure: Procedure }>(), {
  procedure: () => Procedure.blank(),
})

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
      referenceId: props.procedure.id,
      type: InvoiceItemType.Procedure,
    },
    relation: { invoice: { customer: true } },
    sort: { id: 'DESC' },
  })
  invoiceItems.value = data.data
  total.value = data.total
}

const changePagination = async (options: { page?: number; limit?: number }) => {
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
          <th>Đơn</th>
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
          <td class="text-center">
            <div style="white-space: nowrap">
              <a @click="openBlankInvoiceDetail(invoiceItem.invoice!.id)">
                IV{{ invoiceItem.invoiceId }}
              </a>
              <span class="ml-2">
                <a-tag color="blue">{{ invoiceItem.invoice?.customer?.fullName }}</a-tag>
              </span>
            </div>
            <div style="font-size: 0.8rem; white-space: nowrap">
              {{ timeToText(invoiceItem.invoice?.time, 'hh:mm DD/MM/YYYY') }}
            </div>
          </td>
          <td class="text-right">
            {{ invoiceItem.quantity }}
          </td>
          <td class="text-right">
            <div
              v-if="invoiceItem.discountMoney"
              class="text-xs italic line-through"
              style="color: #ff4d4f"
            >
              {{ formatMoney(invoiceItem.expectedPrice) }}
            </div>
            {{ formatMoney(invoiceItem.actualPrice) }}
          </td>
          <td class="text-right">
            {{ formatMoney(invoiceItem.quantity * invoiceItem.actualPrice) }}
          </td>

          <td class="text-center">
            <InvoiceStatusTag :status="invoiceItem.invoice!.status" />
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
</template>
