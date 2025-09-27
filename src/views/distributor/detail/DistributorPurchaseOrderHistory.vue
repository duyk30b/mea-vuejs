<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import VueButton from '@/common/VueButton.vue'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Distributor } from '@/modules/distributor'
import { PurchaseOrderQueryApi, type PurchaseOrder } from '@/modules/purchase-order'
import { timeToText } from '@/utils'
import PurchaseOrderStatusTag from '@/views/purchase-order/PurchaseOrderStatusTag.vue'
import VuePagination from '@/common/VuePagination.vue'

const props = withDefaults(defineProps<{ distributor: Distributor }>(), {
  distributor: () => Distributor.blank(),
})

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const purchaseOrderList = ref<PurchaseOrder[]>([])
const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFetchData = async () => {
  const paginationResponse = await PurchaseOrderQueryApi.pagination({
    page: page.value,
    limit: limit.value,
    filter: { distributorId: props.distributor.id! },
    relation: { distributor: false, purchaseOrderItemList: false },
    sort: { id: 'DESC' },
  })
  purchaseOrderList.value = paginationResponse.purchaseOrderList
  total.value = paginationResponse.total
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
  }
  await startFetchData()
}

watch(
  () => props.distributor.id,
  async (newValue) => {
    if (newValue) await startFetchData()
    else purchaseOrderList.value = []
  },
  { immediate: true },
)

const openBlankPurchaseOrderDetail = (purchaseOrderId: string) => {
  const route = router.resolve({
    name: 'PurchaseOrderDetailContainer',
    params: { id: purchaseOrderId },
  })
  window.open(route.href, '_blank')
}

const openBlankPurchaseOrderUpsert = (distributorId: number) => {
  const route = router.resolve({
    name: 'PurchaseOrderUpsertContainer',
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
        <VueButton icon="plus" color="blue" @click="openBlankPurchaseOrderUpsert(distributor.id)">
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
          <tr v-if="purchaseOrderList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(purchaseOrder, index) in purchaseOrderList" :key="index">
            <td>
              <div>
                <a @click="openBlankPurchaseOrderDetail(purchaseOrder.id)">NH{{ purchaseOrder.id }}</a>
                <span class="ml-2">
                  <PurchaseOrderStatusTag :purchaseOrder="purchaseOrder" />
                </span>
              </div>
              <div style="font-size: 0.8rem; white-space: nowrap">
                {{ timeToText(purchaseOrder.startedAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </td>
            <td class="text-right">
              <div>
                {{ formatMoney(purchaseOrder.surcharge) }}
              </div>
            </td>
            <td class="text-right">
              <div style="font-weight: 500">
                {{ formatMoney(purchaseOrder.totalMoney) }}
              </div>
              <div v-if="purchaseOrder.debt">
                <i>
                  <small>Nợ: {{ formatMoney(purchaseOrder.debt) }}</small>
                </i>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="p-4 flex flex-wrap justify-end gap-4">
      <VuePagination
        v-model:page="page"
        :total="total"
        :limit="limit"
        @update:page="(p: any) => changePagination({ page: p, limit })"
      />
    </div>
  </div>
</template>
