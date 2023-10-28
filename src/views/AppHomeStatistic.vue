<script setup lang="ts">
// 2 màu khác trông cũng đẹp:  9dc183 ff6761 ff6f61 daa520 708090 ff7f50
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Colors,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import { useMeStore } from '../modules/_me/me.store'
import { PermissionId } from '../modules/permission/permission.enum'
import TopCustomerDebt from './statistic/statistic-customer/TopCustomerDebt.vue'
import TopBatchExpiryDate from './statistic/statistic-product/TopBatchExpiryDate.vue'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Colors,
  Title,
  Tooltip,
  Legend
)
const meStore = useMeStore()
const { permissionIdMap } = meStore
</script>

<template>
  <div class="flex flex-wrap bg-white p-4 gap-8">
    <div
      v-if="permissionIdMap[PermissionId.STATISTIC_PRODUCT]"
      style="flex-grow: 1; flex-basis: 400px"
    >
      <TopBatchExpiryDate />
    </div>
    <div
      v-if="permissionIdMap[PermissionId.STATISTIC_CUSTOMER]"
      style="flex-grow: 1; flex-basis: 400px"
    >
      <TopCustomerDebt />
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
