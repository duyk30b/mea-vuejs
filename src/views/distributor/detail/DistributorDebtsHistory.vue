<script setup lang="ts">
import { Distributor, DistributorDebt, DistributorDebtService } from '@/modules/distributor'
import { DebtType } from '@/modules/enum'
import { useOrganizationStore } from '@/store/organization.store'
import { timeToText } from '@/utils'
import { CheckCircleOutlined, MinusCircleOutlined } from '@ant-design/icons-vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{ distributor: Distributor }>(),
  { distributor: () => Distributor.blank() }
)

const router = useRouter()

const organizationStore = useOrganizationStore()
const { formatMoney } = organizationStore

const distributorDebtList = ref<DistributorDebt[]>([])
const page = ref(1)
const limit = ref(Number(localStorage.getItem('DISTRIBUTOR_DEBTS_PAGINATION_LIMIT')) || 10)
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
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('DISTRIBUTOR_DEBTS_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

const addCustomerDebt = (data: DistributorDebt) => {
  distributorDebtList.value.unshift(data)
}

const openBlankReceiptDetail = async (receiptId: number) => {
  let route = router.resolve({
    name: 'ReceiptDetails',
    params: { id: receiptId },
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
          <th>Phiếu nhập</th>
          <th>Action</th>
          <th>Tiền</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="distributorDebtList.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="(debt, index) in distributorDebtList" :key="index">
          <td>
            <div v-if="debt.receiptId">
              <a @click="openBlankReceiptDetail(debt.receiptId)"> RC{{ debt.receiptId }} </a>
            </div>
            <div style="font-size: 0.8rem; white-space: nowrap">
              {{ timeToText(debt.createTime, 'hh:mm DD/MM/YYYY') }}
            </div>
          </td>
          <td class="text-justify">
            <div>
              <a-tag v-if="debt.type === DebtType.Borrow" color="processing">
                <template #icon>
                  <CheckCircleOutlined />
                </template>
                Nhập hàng
              </a-tag>
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
            </div>
            <div v-if="debt.note" style="font-size: 0.8rem;">{{ debt.note }}</div>
          </td>
          <td class="text-right">
            <div style="white-space: nowrap"> {{ formatMoney(debt.money) }}</div>
            <div style="font-size: 0.8rem; white-space: nowrap">Nợ còn: {{ formatMoney(debt.closeDebt) }}</div>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="mt-4 mb-2 flex justify-end">
      <a-pagination v-model:current="page" v-model:pageSize="limit" :total="total" show-size-changer
        @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })" />
    </div>
  </div>
</template>
