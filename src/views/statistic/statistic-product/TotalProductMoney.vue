<script setup lang="ts">
import type { ChartData } from 'chart.js'
import { onBeforeMount, reactive, ref } from 'vue'
import { Pie } from 'vue-chartjs'
import { StatisticService } from '../../../modules/statistics'
import { useOrganizationStore } from '../../../store/organization.store'

const organizationStore = useOrganizationStore()
const { formatMoney } = organizationStore

const pieData = reactive<ChartData<'pie', number[], unknown>>({ labels: [], datasets: [] })
const options = reactive({
  responsive: true,
  // maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: 'Tổng tồn kho: 0',
      position: 'top',
      font: { size: 16 },
    },
    legend: { reverse: true },
  },
})

const loaded = ref(false)

const startFetchData = async () => {
  try {
    loaded.value = false
    const data = await StatisticService.sumWarehouse()
    pieData.labels = ['Lãi dự kiến', 'Tổng nhập']
    pieData.datasets = [
      {
        // backgroundColor: ['#41B883', '#E46651'],
        data: [data.totalRetailMoney - data.totalCostMoney, data.totalCostMoney],
      },
    ]
    options.plugins.title.text = 'Tổng tồn kho: ' + formatMoney(data.totalRetailMoney)
  } catch (error) {
    console.log('🚀 ~ file: ProductReport.vue:28 ~ startFetchData ~ error:', error)
  } finally {
    loaded.value = true
  }
}

onBeforeMount(async () => await startFetchData())
</script>

<template>
  <div>
    <div>
      <Pie v-if="loaded" :data="pieData" :options="options" />
    </div>
  </div>
</template>
