<script setup lang="ts">
import { StatisticService } from '@/modules/statistics'
import { useOrganizationStore } from '@/store/organization.store'
import type { ChartData, ChartOptions } from 'chart.js'
import { onBeforeMount, reactive, ref } from 'vue'
import { Bar } from 'vue-chartjs'

const organizationStore = useOrganizationStore()
const moneyDivision = organizationStore.SYSTEM_SETTING.moneyDivisionFormat

const barData = reactive<ChartData<'bar', (number | [number, number] | null)[], unknown>>({
  labels: [],
  datasets: [],
})
const options: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
    },
    x: {
      ticks: {
        callback(value, index, ticks_array) {
          let characterLimit = 12
          let label = this.getLabelForValue(value as number)
          if (label.length >= characterLimit) {
            return (
              label
                .slice(0, label.length)
                .substring(0, characterLimit - 1)
                .trim() + '...'
            )
          }
          return label
        },
      },
    },
  },
}

const loaded = ref(false)

const startFetchData = async () => {
  try {
    loaded.value = false
    const data = await StatisticService.topProductHighCostMoney({ limit: 10 })
    barData.labels = Array.from({ length: 10 }, (_, i) => '')
    barData.datasets = [
      {
        type: 'bar',
        label: 'Tiền nhập',
        data: Array.from({ length: 10 }, (_, i) => 0),
        borderWidth: 1,
        stack: 'Stack 0',
      },
      {
        type: 'bar',
        label: 'Lãi dự kiến',
        data: Array.from({ length: 10 }, (_, i) => 0),
        borderWidth: 1,
        stack: 'Stack 0',
      },
    ]
    barData.labels.splice(0, data.length, ...data.map((i) => i.product.brandName))
    barData.datasets[0].data.splice(
      0,
      data.length,
      ...data.map((i) => {
        return i.sumCostMoney / moneyDivision
      })
    )
    barData.datasets[1].data.splice(
      0,
      data.length,
      ...data.map((i) => {
        return (i.sumRetailMoney - i.sumCostMoney) / moneyDivision
      })
    )
  } catch (error) {
    console.log('🚀 ~ file: ProductReport.vue:28 ~ startFetchData ~ error:', error)
  } finally {
    loaded.value = true
  }
}

onBeforeMount(async () => await startFetchData())
</script>

<template>
  <div class="flex flex-col" style="height: 100%">
    <div style="height: 80px" class="flex items-center">
      <span style="font-size: 18px; font-weight: 500"> Hàng tồn tổng giá trị cao </span>
    </div>
    <div class="flex-1">
      <Bar v-if="loaded" :data="barData" :options="options as any" />
    </div>
  </div>
</template>
