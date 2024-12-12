<script setup lang="ts">
import { PlusOutlined } from '@ant-design/icons-vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Distributor } from '../../../modules/distributor'
import { ReceiptApi, type Receipt } from '../../../modules/receipt'
import { timeToText } from '../../../utils'
import ReceiptStatusTag from '../../../views/receipt/ReceiptStatusTag.vue'
import VueButton from '../../../common/VueButton.vue'

const props = withDefaults(defineProps<{ distributor: Distributor }>(), {
  distributor: () => Distributor.blank(),
})

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const receipts = ref<Receipt[]>([])
const page = ref(1)
const limit = ref(
  Number(localStorage.getItem('DISTRIBUTOR_RECEIPT_HISTORY_PAGINATION_LIMIT')) || 10
)
const total = ref(0)

const startFetchData = async () => {
  const { data, meta } = await ReceiptApi.pagination({
    page: page.value,
    limit: limit.value,
    filter: { distributorId: props.distributor.id! },
    relation: { distributor: false, receiptItemList: false },
    sort: { id: 'DESC' },
  })
  receipts.value = data
  total.value = meta.total
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('DISTRIBUTOR_RECEIPT_HISTORY_PAGINATION_LIMIT', String(options.limit))
  }
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

const openBlankReceiptDetail = (receiptId: number) => {
  let route = router.resolve({
    name: 'ReceiptDetail',
    params: { id: receiptId },
  })
  window.open(route.href, '_blank')
}

const openBlankReceiptUpsert = (distributorId: number) => {
  let route = router.resolve({
    name: 'ReceiptUpsert',
    query: { distributor_id: distributorId, mode: 'CREATE' },
  })
  window.open(route.href, '_blank')
}
</script>

<template>
  <div class="mt-4">
    <div class="flex justify-between items-end">
      <div>
        NCC:
        <b>{{ distributor.fullName }}</b>
        - {{ distributor.phone }}
      </div>
      <div>
        <VueButton icon="plus" color="blue" @click="openBlankReceiptUpsert(distributor.id)">
          Phiếu nhập mới
        </VueButton>
      </div>
    </div>
    <div class="table-wrapper mt-4 w-full">
      <table>
        <thead>
          <tr>
            <th>Phiếu</th>
            <th>Phụ Phí</th>
            <th>T.Tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="receipts.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(receipt, index) in receipts" :key="index">
            <td>
              <div>
                <a @click="openBlankReceiptDetail(receipt.id)">NH{{ receipt.id }}</a>
                <span class="ml-2">
                  <ReceiptStatusTag :receipt="receipt" />
                </span>
              </div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(receipt.startedAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </td>
            <td class="text-right">
              <div>
                {{ formatMoney(receipt.surcharge) }}
              </div>
            </td>
            <td class="text-right">
              <div style="font-weight: 500">
                {{ formatMoney(receipt.totalMoney) }}
              </div>
              <div v-if="receipt.debt">
                <i>
                  <small>Nợ: {{ formatMoney(receipt.debt) }}</small>
                </i>
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
          @change="
            (page: number, pageSize: number) => changePagination({ page, limit: pageSize })
          " />
      </div>
    </div>
  </div>
</template>
