<script setup lang="ts">
import VuePagination from '@/common/VuePagination.vue'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Distributor } from '@/modules/distributor'
import { PurchaseOrderItem, PurchaseOrderItemApi } from '@/modules/purchase-order-item'
import { ESTimer, formatPhone } from '@/utils'
import { BugDevelopment } from '@/views/component'
import PurchaseOrderLink from '@/views/purchase-order/PurchaseOrderLink.vue'
import PurchaseOrderStatusTag from '@/views/purchase-order/PurchaseOrderStatusTag.vue'
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{ distributor: Distributor }>(), {
  distributor: () => Distributor.blank(),
})

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const purchaseOrderItemList = ref<PurchaseOrderItem[]>([])
const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const paginationResponse = await PurchaseOrderItemApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        distributorId: props.distributor.id!,
      },
      relation: {
        product: true,
        purchaseOrder: { distributor: false },
      },
      sort: { id: 'DESC' },
    })
    purchaseOrderItemList.value = paginationResponse.purchaseOrderItemList
    total.value = paginationResponse.total
  } catch (error) {
    console.log('🚀 ~ file: DistributorProductHistory copy.vue:37 ~ error:', error)
  }
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
    else purchaseOrderItemList.value = []
  },
  { immediate: true },
)
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
          <tr v-if="purchaseOrderItemList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(purchaseOrderItem, index) in purchaseOrderItemList" :key="index">
            <td>
              <div class="font-medium">
                {{ purchaseOrderItem.product!.brandName }}
              </div>
              <div class="flex flex-wrap gap-1 items-center">
                <PurchaseOrderLink
                  :purchaseOrder="purchaseOrderItem.purchaseOrder"
                  :purchaseOrderId="purchaseOrderItem.purchaseOrderId"
                />
                <PurchaseOrderStatusTag :purchaseOrder="purchaseOrderItem.purchaseOrder" />
              </div>
              <div style="font-size: 0.8rem">
                {{
                  ESTimer.timeToText(purchaseOrderItem.purchaseOrder?.startedAt, 'DD/MM/YYYY hh:mm')
                }}
              </div>
            </td>
            <td class="text-center">
              {{ purchaseOrderItem.unitQuantityFix }}
            </td>
            <td class="text-right">
              <div style="white-space: nowrap">
                {{ formatMoney(purchaseOrderItem.unitCostPrice) }}
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
            <th v-if="CONFIG.MODE === 'development'"></th>
            <th>Thời gian</th>
            <th>Phiếu</th>
            <th>Sản phẩm</th>
            <th>Đơn vị</th>
            <th>S.Lượng</th>
            <th>G.Nhập</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="purchaseOrderItemList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(purchaseOrderItem, index) in purchaseOrderItemList" :key="index">
            <td v-if="CONFIG.MODE === 'development'" style="text-align: center">
              <BugDevelopment :data="purchaseOrderItem" />
            </td>
            <td class="text-center">
              {{
                ESTimer.timeToText(purchaseOrderItem.purchaseOrder?.startedAt, 'hh:mm DD/MM/YYYY')
              }}
            </td>
            <td>
              <div class="flex flex-wrap gap-1 items-center">
                <PurchaseOrderLink
                  :purchaseOrder="purchaseOrderItem.purchaseOrder"
                  :purchaseOrderId="purchaseOrderItem.purchaseOrderId"
                />
                <PurchaseOrderStatusTag :purchaseOrder="purchaseOrderItem.purchaseOrder" />
              </div>
            </td>
            <td>
              <div class="font-medium">
                {{ purchaseOrderItem.product!.brandName }}
              </div>
            </td>
            <td class="text-center">
              {{ purchaseOrderItem.unitName }}
            </td>
            <td class="text-center">
              {{ purchaseOrderItem.unitQuantityFix }}
            </td>
            <td class="text-right">
              <div style="white-space: nowrap">
                {{ formatMoney(purchaseOrderItem.unitCostPrice) }}
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
