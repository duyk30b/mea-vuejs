<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js'
import dayjs, { type Dayjs } from 'dayjs'
import { onBeforeMount, reactive, ref } from 'vue'
import { Bar } from 'vue-chartjs'
import { VueSelect } from '../../../common/vue-form'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { StatisticService } from '../../../modules/statistics'
import { DTimer } from '../../../utils'

const settingStore = useSettingStore()
const moneyDivision = settingStore.SYSTEM_SETTING.moneyDivisionFormat
const { isMobile, formatMoney } = settingStore

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
          const characterLimit = 12
          const label = this.getLabelForValue(value as number)
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

const now = new Date()
const endMonth = DTimer.endOfMonth(now)
const startMonth = DTimer.startOfMonth(now)

const loaded = ref(false)
const timeRanger = ref<[Dayjs, Dayjs]>([dayjs(startMonth), dayjs(endMonth)])
const typeBestSelling = ref<'topQuantity' | 'topActualMoney' | 'topProfit'>('topQuantity')

const startFetchHighQuantity = async () => {
  const data = await StatisticService.topProductBestSelling({
    fromTime: timeRanger.value?.[0].startOf('day').toISOString(),
    toTime: timeRanger.value?.[1].endOf('day').toISOString(),
    limit: isMobile ? 10 : 20,
    orderBy: 'sumQuantity',
  })
  barData.labels = Array.from({ length: isMobile ? 10 : 20 }, (_, i) => '')
  barData.datasets = [
    {
      type: 'bar',
      label: 'Số lượng',
      data: Array.from({ length: isMobile ? 10 : 20 }, (_, i) => 0),
      borderWidth: 1,
      stack: 'Stack 0',
    },
  ]
  barData.labels.splice(0, data.length, ...data.map((i) => i.product.brandName))
  barData.datasets[0].data.splice(0, data.length, ...data.map((i) => i.sumQuantity))
}

const startFetchHighProfit = async () => {
  const data = await StatisticService.topProductBestSelling({
    fromTime: timeRanger.value?.[0].startOf('day').toISOString(),
    toTime: timeRanger.value?.[1].endOf('day').toISOString(),
    limit: isMobile ? 10 : 20,
    orderBy: 'sumProfit',
  })
  barData.labels = Array.from({ length: isMobile ? 10 : 20 }, (_, i) => '')
  barData.datasets = [
    {
      type: 'bar',
      label: 'Tiền cost',
      data: Array.from({ length: isMobile ? 10 : 20 }, (_, i) => 0),
      borderWidth: 1,
      stack: 'Stack 0',
    },
    {
      type: 'bar',
      label: 'Tiền lãi',
      data: Array.from({ length: isMobile ? 10 : 20 }, (_, i) => 0),
      borderWidth: 1,
      stack: 'Stack 0',
    },
  ]
  barData.labels.splice(0, data.length, ...data.map((i) => i.product.brandName))
  barData.datasets[0].data.splice(
    0,
    data.length,
    ...data.map((i) => {
      return i.sumCostAmount / moneyDivision
    })
  )
  barData.datasets[1].data.splice(
    0,
    data.length,
    ...data.map((i) => {
      return i.sumProfit / moneyDivision
    })
  )
}

const startFetchHighActualMoney = async () => {
  const data = await StatisticService.topProductBestSelling({
    fromTime: timeRanger.value?.[0].startOf('day').toISOString(),
    toTime: timeRanger.value?.[1].endOf('day').toISOString(),
    limit: isMobile ? 10 : 20,
    orderBy: 'sumActualMoney',
  })
  barData.labels = Array.from({ length: isMobile ? 10 : 20 }, (_, i) => '')
  barData.datasets = [
    {
      type: 'bar',
      label: 'Tiền cost',
      data: Array.from({ length: isMobile ? 10 : 20 }, (_, i) => 0),
      borderWidth: 1,
      stack: 'Stack 0',
    },
    {
      type: 'bar',
      label: 'Tiền lãi',
      data: Array.from({ length: isMobile ? 10 : 20 }, (_, i) => 0),
      borderWidth: 1,
      stack: 'Stack 0',
    },
  ]
  barData.labels.splice(0, data.length, ...data.map((i) => i.product.brandName))
  barData.datasets[0].data.splice(
    0,
    data.length,
    ...data.map((i) => {
      return i.sumCostAmount / moneyDivision
    })
  )
  barData.datasets[1].data.splice(
    0,
    data.length,
    ...data.map((i) => {
      return i.sumProfit / moneyDivision
    })
  )
}

const startFetchData = async () => {
  try {
    loaded.value = false
    if (typeBestSelling.value === 'topQuantity') {
      await startFetchHighQuantity()
    } else if (typeBestSelling.value === 'topActualMoney') {
      await startFetchHighActualMoney()
    } else if (typeBestSelling.value === 'topProfit') {
      await startFetchHighProfit()
    }
  } catch (error) {
    console.log('🚀 ~ file: ProductReport.vue:28 ~ startFetchData ~ error:', error)
  } finally {
    loaded.value = true
  }
}

const handleChangeTime = async (value: any) => {
  if (!value) return
  await startFetchData()
}

onBeforeMount(async () => await startFetchData())
</script>

<template>
  <div class="flex flex-col" style="height: 100%">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
      style="height: 80px"
    >
      <div class="flex items-center gap-4">
        <span style="font-size: 18px; font-weight: 500">Hàng bán chạy nhất:</span>
        <div style="width: 140px">
          <VueSelect
            v-model:value="typeBestSelling"
            :options="[
              { text: 'Số lượng', value: 'topQuantity' },
              { text: 'Tiền bán', value: 'topActualMoney' },
              { text: 'Tiền lãi', value: 'topProfit' },
            ]"
            @selectItem="startFetchData"
          />
        </div>
      </div>
      <a-range-picker
        v-model:value="timeRanger"
        :onChange="handleChangeTime"
        format="DD-MM-YYYY"
        :placeholder="['DD-MM-YYYY', 'DD-MM-YYYY']"
      />
    </div>
    <div class="flex-1">
      <Bar v-if="loaded" :data="barData" :options="options as any" />
    </div>
  </div>
</template>
