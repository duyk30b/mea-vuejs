<script setup lang="ts">
import { StatisticProductApi } from '@/modules/statistics'
import { onBeforeMount, ref } from 'vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import type { Warehouse } from '../../../modules/warehouse'
import { WarehouseService } from '../../../modules/warehouse/warehouse.service'

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const warehouseMap = ref<Record<string, Warehouse>>({})

const loaded = ref(false)
const statisticWarehouse = ref<
  {
    warehouseId: number
    sumCostAmount: number
    sumRetailAmount: number
  }[]
>([])

const startFetchData = async () => {
  try {
    loaded.value = false
    statisticWarehouse.value = await StatisticProductApi.sumWarehouse()
  } catch (error) {
    console.log('🚀 ~ TotalProductMoney.vue:26 ~ startFetchData ~ error:', error)
  } finally {
    loaded.value = true
  }
}

onBeforeMount(async () => {
  const promise = await Promise.all([WarehouseService.getMap(), startFetchData()])
  warehouseMap.value = promise[0]
})
</script>

<template>
  <div class="">
    <div class="flex justify-between items-center">
      <span style="font-size: 18px; font-weight: 500">Thống kê kho:</span>
    </div>
    <div class="mt-2 table-wrapper">
      <table class="">
        <thead>
          <tr>
            <th>#</th>
            <th>Tên Kho</th>
            <th>Tổng vốn</th>
            <th>Dự kiến bán</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="statisticWarehouse.length === 0">
            <td colspan="20" class="text-center">Không có sản phẩm cận date</td>
          </tr>
          <tr v-for="(w, index) in statisticWarehouse" :key="index">
            <td class="text-center" style="white-space: nowrap">
              {{ index + 1 }}
            </td>
            <td>{{ warehouseMap[w.warehouseId]?.name || 'Kho mặc định' }}</td>
            <td class="text-right" style="white-space: nowrap">
              {{ formatMoney(w.sumCostAmount || 0) }}
            </td>
            <td class="text-right" style="white-space: nowrap">
              {{ formatMoney(w.sumRetailAmount || 0) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
