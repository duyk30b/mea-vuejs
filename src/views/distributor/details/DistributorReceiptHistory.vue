<script setup lang="ts">
import { Distributor } from '@/modules/distributor'
import { PaymentStatus, PaymentStatusText } from '@/modules/enum'
import { ReceiptService, type Receipt } from '@/modules/receipt'
import { formatNumber, timeToText } from '@/utils'
import { CheckCircleOutlined, ExclamationCircleOutlined, PlusOutlined, StopOutlined } from '@ant-design/icons-vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{ distributor: Distributor }>(),
  { distributor: () => Distributor.blank() }
)

const router = useRouter()

const receipts = ref<Receipt[]>([])
const page = ref(1)
const limit = ref(5)
const total = ref(0)

const startFetchData = async () => {
  const data = await ReceiptService.pagination({
    page: page.value,
    limit: limit.value,
    filter: { distributor_id: props.distributor.id! },
    relations: { distributor: false, receipt_items: false },
    sort: { id: 'DESC' },
  })
  receipts.value = data.data
  total.value = data.total
}

const changePagination = async (options: { page?: number, limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit
  await startFetchData()
}

watch(
  () => props.distributor.id,
  async (newValue) => {
    if (newValue) await startFetchData()
    else receipts.value = []
  },
  { immediate: true }
)

const openBlankPurchaseReceiptDetails = (i: Receipt) => {
  let route = router.resolve({
    name: 'PurchaseReceiptDetails',
    params: { id: i.purchaseId },
    query: { receipt_id: i.id },
  })
  window.open(route.href, '_blank')
}

const openBlankPurchaseReceiptUpsert = (distributorId: number) => {
  let route = router.resolve({
    name: 'PurchaseReceiptUpsert',
    query: { distributor_id: distributorId },
  })
  window.open(route.href, '_blank')
}
</script>

<template>
  <div>
    <div class="flex justify-between items-end">
      <div>
        NCC: <b>{{ distributor.fullNameVi }}</b> - {{ distributor.phone }}
      </div>
      <div>
        <a-button type="primary" @click="openBlankPurchaseReceiptUpsert(distributor.id)">
          <template #icon>
            <PlusOutlined />
          </template>
          Tạo phiếu nhập mới
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
            <th>Mã phiếu</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="receipts.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(receipt, index) in receipts" :key="index">
            <td class="text-center">{{ timeToText(receipt.refundTime || receipt.paymentTime, 'hh:mm DD/MM/YYYY') }}</td>
            <td class="text-right">
              <div style="font-weight: 500;">{{ formatNumber(receipt.totalMoney) }}</div>
              <div v-if="receipt.debt"><i><small>Nợ: {{ formatNumber(receipt.debt) }}</small></i></div>
            </td>
            <td class="text-center">
              <a-tag v-if="receipt.paymentStatus === PaymentStatus.Full" color="success">
                <template #icon>
                  <CheckCircleOutlined />
                </template>
                {{ PaymentStatusText[PaymentStatus.Full] }}
              </a-tag>
              <a-tag v-if="receipt.paymentStatus === PaymentStatus.Unpaid" color="warning">
                <template #icon>
                  <ExclamationCircleOutlined />
                </template>
                {{ PaymentStatusText[PaymentStatus.Unpaid] }}
              </a-tag>
              <a-tag v-if="receipt.paymentStatus === PaymentStatus.Refund" color="error">
                <template #icon>
                  <StopOutlined />
                </template>
                {{ PaymentStatusText[PaymentStatus.Refund] }}
              </a-tag>
            </td>
            <td class="text-center">
              <a @click="openBlankPurchaseReceiptDetails(receipt)"> RC{{ receipt.id }} </a>
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
