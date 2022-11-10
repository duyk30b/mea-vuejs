<script setup lang="ts">
import { Distributor, DistributorDebt, DistributorDebtService } from '@/modules/distributor'
import { DebtType } from '@/modules/enum'
import { ReceiptService } from '@/modules/receipt'
import { formatNumber, timeToText } from '@/utils'
import { CheckCircleOutlined, FileSearchOutlined, MinusCircleOutlined } from '@ant-design/icons-vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{ distributor: Distributor }>(),
  { distributor: () => Distributor.blank() }
)

const router = useRouter()

const distributorDebtList = ref<DistributorDebt[]>([])
const page = ref(1)
const limit = ref(5)
const total = ref(0)

const startFetchData = async () => {
  const data = await DistributorDebtService.pagination({
    page: page.value,
    limit: limit.value,
    filter: { distributor_id: props.distributor.id! },
    sort: { id: 'DESC' },
  })
  distributorDebtList.value = data.data
  total.value = data.total
}

watch(
  () => props.distributor.id,
  async (newValue) => {
    if (newValue) await startFetchData()
    else distributorDebtList.value = []
  },
  { immediate: true }
)

const changePagination = async (options: { page?: number, limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit
  await startFetchData()
}

const addCustomerDebt = (data: DistributorDebt) => {
  distributorDebtList.value.unshift(data)
}

const openBlankPurchaseReceiptDetails = async (receiptId: number) => {
  const receipt = await ReceiptService.getOne(receiptId, { distributor: false, receiptItems: false })
  let route = router.resolve({
    name: 'PurchaseReceiptDetails',
    params: { id: receipt.purchaseId },
    query: { receipt_id: receipt.id },
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
          <th>Phiếu</th>
          <th>Ghi chú</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="distributorDebtList.length === 0">
          <td colspan="20" class="text-center">No data</td>
        </tr>
        <tr v-for="(debt, index) in distributorDebtList" :key="index">
          <td class="text-center">DD{{ debt.id }}</td>
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
            <a v-if="debt.receiptId" @click="openBlankPurchaseReceiptDetails(debt.receiptId)">
              RC{{ debt.receiptId }}
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
