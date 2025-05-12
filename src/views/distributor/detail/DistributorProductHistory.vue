<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import VuePagination from '../../../common/VuePagination.vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Distributor } from '../../../modules/distributor'
import { ReceiptItem, ReceiptItemApi } from '../../../modules/receipt-item'
import { ESTimer, formatPhone } from '../../../utils'
import ReceiptStatusTag from '../../receipt/ReceiptStatusTag.vue'

const props = withDefaults(defineProps<{ distributor: Distributor }>(), {
  distributor: () => Distributor.blank(),
})

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const receiptItemList = ref<ReceiptItem[]>([])
const page = ref(1)
const limit = ref(Number(localStorage.getItem('CUSTOMER_PRODUCT_HISTORY_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const { data, meta } = await ReceiptItemApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        distributorId: props.distributor.id!,
      },
      relation: {
        product: true,
        receipt: { distributor: false },
      },
      sort: { id: 'DESC' },
    })
    receiptItemList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: DistributorProductHistory copy.vue:37 ~ error:', error)
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('CUSTOMER_PRODUCT_HISTORY_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

watch(
  () => props.distributor.id,
  async (newValue) => {
    if (newValue) await startFetchData()
    else receiptItemList.value = []
  },
  { immediate: true },
)

const openBlankReceiptDetail = (receiptId: number) => {
  const route = router.resolve({
    name: 'ReceiptDetail',
    params: { id: receiptId },
  })
  window.open(route.href, '_blank')
}
</script>

<template>
  <div class="mt-4">
    <div class="flex flex-wrap items-center gap-2">
      <span>
        KH:
        <b>{{ distributor.fullName }}</b>
      </span>
      <span>
        <a :href="'tel:' + distributor.phone">{{ formatPhone(distributor.phone || '') }}</a>
      </span>
    </div>
    <div v-if="isMobile" class="mt-4 w-full table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th>SL</th>
            <th>G.Nhập</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="receiptItemList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(receiptItem, index) in receiptItemList" :key="index">
            <td>
              <div class="font-medium">
                {{ receiptItem.product!.brandName }}
              </div>
              <div>
                <a @click="openBlankReceiptDetail(receiptItem.receiptId)">
                  NH{{ receiptItem.receiptId }}
                </a>
                <span class="ml-2">
                  <ReceiptStatusTag :receipt="receiptItem.receipt" />
                </span>
              </div>
              <div style="font-size: 0.8rem">
                {{ ESTimer.timeToText(receiptItem.receipt?.startedAt, 'DD/MM/YYYY hh:mm') }}
              </div>
            </td>
            <td class="text-center">
              {{ receiptItem.unitQuantity }}
            </td>
            <td class="text-right">
              <div style="white-space: nowrap">
                {{ formatMoney(receiptItem.unitCostPrice) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!isMobile" class="table-wrapper mt-4 w-full">
      <table>
        <thead>
          <tr>
            <th>HĐ</th>
            <th>Sản phẩm</th>
            <th>Đơn vị</th>
            <th>S.Lượng</th>
            <th>G.Nhập</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="receiptItemList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(receiptItem, index) in receiptItemList" :key="index">
            <td>
              <div>
                <a @click="openBlankReceiptDetail(receiptItem.receiptId)">
                  NH{{ receiptItem.receiptId }}
                </a>
                <span class="ml-2">
                  <ReceiptStatusTag :receipt="receiptItem.receipt" />
                </span>
              </div>
              <div style="font-size: 0.8rem">
                {{ ESTimer.timeToText(receiptItem.receipt?.startedAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </td>
            <td>
              <div class="font-medium">
                {{ receiptItem.product!.brandName }}
              </div>
            </td>
            <td class="text-center">
              {{ receiptItem.unitName }}
            </td>
            <td class="text-center">
              {{ receiptItem.unitQuantity }}
            </td>
            <td class="text-right">
              <div style="white-space: nowrap">
                {{ formatMoney(receiptItem.unitCostPrice) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="p-4 flex flex-wrap justify-end gap-4">
      <VuePagination
        class="ml-auto"
        v-model:page="page"
        :total="total"
        :limit="limit"
        @update:page="(p: any) => changePagination({ page: p, limit })"
      />
    </div>
  </div>
</template>
