<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js'
import { onBeforeMount, reactive, ref } from 'vue'
import { Bar } from 'vue-chartjs'
import { VueSelect } from '../../../common/vue-form'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { StatisticService } from '../../../modules/statistics'

const screenStore = useScreenStore()
const moneyDivision = screenStore.SYSTEM_SETTING.moneyDivisionFormat
const { isMobile, formatMoney } = screenStore

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
const typeHighMoney = ref<'quantity' | 'costAmount' | 'sumRetailMoney'>('costAmount')

const startFetchData = async () => {
  try {
    loaded.value = false
    const data = await StatisticService.topProductHightMoney({
      limit: isMobile ? 10 : 20,
      orderBy: typeHighMoney.value,
    })

    barData.labels = Array.from({ length: isMobile ? 10 : 20 }, (_, i) => '')
    barData.datasets = [
      {
        type: 'bar',
        label: 'Tiền vốn',
        data: Array.from({ length: isMobile ? 10 : 20 }, (_, i) => 0),
        borderWidth: 1,
        stack: 'Stack 0',
      },
      {
        type: 'bar',
        label: 'Lãi dự kiến',
        data: Array.from({ length: isMobile ? 10 : 20 }, (_, i) => 0),
        borderWidth: 1,
        stack: 'Stack 0',
      },
    ]
    barData.labels.splice(0, data.length, ...data.map((i) => i.brandName))
    barData.datasets[0].data.splice(
      0,
      data.length,
      ...data.map((i) => {
        return i.costAmount / moneyDivision
      })
    )
    barData.datasets[1].data.splice(
      0,
      data.length,
      ...data.map((i) => {
        return (i.retailPrice * i.quantity - i.costAmount) / moneyDivision
      })
    )
  } catch (error) {
    console.log('🚀 ~ file: ProductReport.vue:28 ~ startFetchData ~ error:', error)
  } finally {
    loaded.value = true
  }
}

const handleChangeTypeHighMoney = async (value: any) => {
  typeHighMoney.value = value
  await startFetchData()
}

onBeforeMount(async () => await startFetchData())
</script>

<template>
  <div class="flex flex-col" style="height: 100%">
    <div style="height: 80px" class="flex items-center gap-4">
      <span style="font-size: 18px; font-weight: 500"> Hàng tồn giá trị cao: </span>
      <div style="width: 120px">
        <VueSelect
          v-model:value="typeHighMoney"
          :options="[
            { text: 'Tiền vốn', value: 'costAmount' },
            { text: 'Tiền bán', value: 'sumRetailMoney' },
          ]"
          @update:value="startFetchData"
        />
      </div>
    </div>
    <div class="flex-1">
      <Bar v-if="loaded" :data="barData" :options="options as any" />
    </div>
  </div>
</template>
