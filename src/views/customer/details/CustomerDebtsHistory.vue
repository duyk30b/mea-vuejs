<script setup lang="ts">
import { Customer, CustomerDebt, CustomerDebtService } from '@/modules/customer'
import { DebtType } from '@/modules/enum'
import { InvoiceService } from '@/modules/invoice'
import { formatNumber, timeToText } from '@/utils'
import { CheckCircleOutlined, MinusCircleOutlined } from '@ant-design/icons-vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{ customer: Customer }>(),
  { customer: () => Customer.blank() }
)

const router = useRouter()

const customerDebtList = ref<CustomerDebt[]>([])
const page = ref(1)
const limit = ref(5)
const total = ref(0)

const startFetchData = async () => {
  try {
    const data = await CustomerDebtService.pagination({
      page: page.value,
      limit: limit.value,
      filter: { customer_id: props.customer.id! },
      sort: { id: 'DESC' },
    })
    customerDebtList.value = data.data
    total.value = data.total
  } catch (error) {
    console.log('🚀 ~ file: CustomerDebtsHistory.vue:33 ~ error:', error)
  }
}

watch(
  () => props.customer.id,
  async (newValue) => {
    if (newValue) await startFetchData()
    else customerDebtList.value = []
  },
  { immediate: true }
)

const changePagination = async (options: { page?: number, limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit
  await startFetchData()
}

const addCustomerDebt = (data: CustomerDebt) => {
  customerDebtList.value.unshift(data)
}

const openBlankArrivalInvoiceDetail = async (invoiceId: number) => {
  const invoice = await InvoiceService.getOne(invoiceId, { customer: false, invoiceItems: false })
  let route = router.resolve({
    name: 'ArrivalInvoiceDetail',
    params: { id: invoice.arrivalId },
    query: { invoice_id: invoice.id },
  })
  window.open(route.href, '_blank')
}

defineExpose({ addCustomerDebt })
</script>

<template>
  <div class="table-wrapper mt-4">
    <table class="table">
      <thead>
        <tr>
          <th>Mã</th>
          <th>Thời gian</th>
          <th>Nợ đầu kỳ</th>
          <th>Tiền</th>
          <th>Nợ cuối kỳ</th>
          <th>Hóa đơn</th>
          <th>Ghi chú</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="customerDebtList.length === 0">
          <td colspan="20" class="text-center">No data</td>
        </tr>
        <tr v-for="(debt, index) in customerDebtList" :key="index">
          <td class="text-center">CD{{ debt.id }}</td>
          <td class="text-center">{{ timeToText(debt.createTime, 'hh:mm DD/MM/YYYY') }}</td>
          <td class="text-right">{{ formatNumber(debt.openDebt) }}</td>
          <td class="text-right">
            <a-tag v-if="debt.type === DebtType.Refund" color="warning">
              <template #icon>
                <MinusCircleOutlined />
              </template>
              Hoàn trả
            </a-tag>
            <a-tag v-if="debt.type === DebtType.PayUp" color="success">
              <template #icon>
                <CheckCircleOutlined />
              </template>
              Trả nợ
            </a-tag>
            {{ formatNumber(debt.money) }}
          </td>
          <td class="text-right">{{ formatNumber(debt.closeDebt) }}</td>
          <td class="text-center">
            <a v-if="debt.invoiceId" @click="openBlankArrivalInvoiceDetail(debt.invoiceId)">
              IV{{ debt.invoiceId }}
            </a>
          </td>
          <td>{{ debt.note }}</td>
        </tr>
      </tbody>
    </table>
    <div class="mt-4 mb-2 flex justify-end">
      <a-pagination v-model:current="page" v-model:pageSize="limit" :total="total"
        @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })" />
    </div>
  </div>
</template>
