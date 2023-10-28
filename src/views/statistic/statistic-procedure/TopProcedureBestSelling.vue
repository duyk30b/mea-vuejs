<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js'
import dayjs, { type Dayjs } from 'dayjs'
import { onBeforeMount, reactive, ref } from 'vue'
import { Bar } from 'vue-chartjs'
import { VueSelect } from '../../../common/vue-form'
import { StatisticService } from '../../../modules/statistics'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { DTimer } from '../../../utils'

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
const typeBestSelling = ref<'topQuantity' | 'topActualMoney'>('topQuantity')

const startFetchHighQuantity = async () => {
  const data = await StatisticService.topProcedureBestSelling({
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
      // backgroundColor: ['rgba(54, 162, 235, 0.2)'],
      // borderColor: ['rgba(54, 162, 235, 1)'],
      borderWidth: 1,
      stack: 'Stack 0',
    },
  ]
  barData.labels.splice(0, data.length, ...data.map((i) => i.procedureName))
  barData.datasets[0].data.splice(0, data.length, ...data.map((i) => i.sumQuantity))
}

const startFetchHighActualMoney = async () => {
  const data = await StatisticService.topProcedureBestSelling({
    fromTime: timeRanger.value?.[0].startOf('day').toISOString(),
    toTime: timeRanger.value?.[1].endOf('day').toISOString(),
    limit: isMobile ? 10 : 20,
    orderBy: 'sumActualMoney',
  })
  barData.labels = Array.from({ length: isMobile ? 10 : 20 }, (_, i) => '')
  barData.datasets = [
    {
      type: 'bar',
      label: 'Tổng tiền',
      data: Array.from({ length: isMobile ? 10 : 20 }, (_, i) => 0),
      // backgroundColor: ['rgba(255, 99, 132, 0.2)'],
      // borderColor: ['rgba(54, 162, 235, 1)'],
      borderWidth: 1,
      stack: 'Stack 0',
    },
  ]
  barData.labels.splice(0, data.length, ...data.map((i) => `${i.procedureName} (${i.sumQuantity})`))
  barData.datasets[0].data.splice(
    0,
    data.length,
    ...data.map((i) => i.sumActualMoney / moneyDivision)
  )
}

const startFetchData = async () => {
  try {
    loaded.value = false
    if (typeBestSelling.value === 'topQuantity') {
      await startFetchHighQuantity()
    } else if (typeBestSelling.value === 'topActualMoney') {
      await startFetchHighActualMoney()
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

const handleChangeTypeBestselling = async (value: any) => {
  typeBestSelling.value = value
  await startFetchData()
}

onBeforeMount(async () => await startFetchData())
</script>

<template>
  <div class="flex flex-col" style="height: 100%">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex justify-between items-center gap-2">
        <span style="font-size: 18px; font-weight: 500">Top dịch vụ:</span>
        <div style="width: 120px">
          <VueSelect
            :value="typeBestSelling"
            :options="[
              { text: 'Số lượng', value: 'topQuantity' },
              { text: 'Tổng tiền', value: 'topActualMoney' },
            ]"
            @update:value="handleChangeTypeBestselling"
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
      <Bar v-if="loaded" :data="barData" :options="(options as any)" />
    </div>
  </div>
</template>
