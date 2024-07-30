<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js'
import dayjs, { type Dayjs } from 'dayjs'
import { onBeforeMount, reactive, ref } from 'vue'
import { Bar } from 'vue-chartjs'
import { VueSelect } from '../../../common/vue-form'
import { StatisticService } from '../../../modules/statistics'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DTimer } from '../../../utils'

const settingStore = useSettingStore()
const moneyDivision = settingStore.SYSTEM_SETTING.moneyDivisionFormat
const { isMobile } = settingStore

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
const typeBestSelling = ref<'topCountInvoice' | 'topTotalMoney' | 'topProfit'>('topTotalMoney')

const startFetchHighCountInvoice = async () => {
  const data = await StatisticService.topCustomerBestTicket({
    fromTime: timeRanger.value?.[0].startOf('day').toISOString(),
    toTime: timeRanger.value?.[1].endOf('day').toISOString(),
    limit: isMobile ? 10 : 20,
    orderBy: 'countTicket',
  })
  barData.labels = Array.from({ length: isMobile ? 10 : 20 }, (_, i) => '')
  barData.datasets = [
    {
      type: 'bar',
      label: 'Số đơn',
      data: Array.from({ length: isMobile ? 10 : 20 }, (_, i) => 0),
      borderWidth: 1,
      stack: 'Stack 0',
    },
  ]
  barData.labels.splice(0, data.length, ...data.map((i) => i.customer.fullName))
  barData.datasets[0].data.splice(0, data.length, ...data.map((i) => i.countTicket))
}

const startFetchHighTotalMoneyInvoice = async () => {
  const data = await StatisticService.topCustomerBestTicket({
    fromTime: timeRanger.value?.[0].startOf('day').toISOString(),
    toTime: timeRanger.value?.[1].endOf('day').toISOString(),
    limit: isMobile ? 10 : 20,
    orderBy: 'sumTotalMoney',
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
      label: 'Chi phí',
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
  barData.labels.splice(
    0,
    data.length,
    ...data.map((i) => `${i.customer.fullName} (${i.countTicket} đơn)`)
  )
  barData.datasets[0].data.splice(
    0,
    data.length,
    ...data.map((i) => i.sumTotalCostAmount / moneyDivision)
  )
  barData.datasets[1].data.splice(0, data.length, ...data.map((i) => i.sumExpense / moneyDivision))
  barData.datasets[2].data.splice(0, data.length, ...data.map((i) => i.sumProfit / moneyDivision))
}

const startFetchHighProfitInvoice = async () => {
  const data = await StatisticService.topCustomerBestTicket({
    fromTime: timeRanger.value?.[0].startOf('day').toISOString(),
    toTime: timeRanger.value?.[1].endOf('day').toISOString(),
    limit: isMobile ? 10 : 20,
    orderBy: 'sumProfit',
  })
  barData.labels = Array.from({ length: isMobile ? 10 : 20 }, (_, i) => '')
  barData.datasets = [
    {
      type: 'bar',
      label: 'Tiền nhập',
      data: Array.from({ length: isMobile ? 10 : 20 }, (_, i) => 0),
      borderWidth: 1,
      stack: 'Stack 0',
    },
    {
      type: 'bar',
      label: 'Chi phí',
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
  barData.labels.splice(
    0,
    data.length,
    ...data.map((i) => `${i.customer.fullName} (${i.countTicket} đơn)`)
  )
  barData.datasets[0].data.splice(
    0,
    data.length,
    ...data.map((i) => i.sumTotalCostAmount / moneyDivision)
  )
  barData.datasets[1].data.splice(0, data.length, ...data.map((i) => i.sumExpense / moneyDivision))
  barData.datasets[2].data.splice(0, data.length, ...data.map((i) => i.sumProfit / moneyDivision))
}

const startFetchData = async () => {
  try {
    loaded.value = false
    if (typeBestSelling.value === 'topCountInvoice') {
      await startFetchHighCountInvoice()
    } else if (typeBestSelling.value === 'topTotalMoney') {
      await startFetchHighTotalMoneyInvoice()
    } else if (typeBestSelling.value === 'topProfit') {
      await startFetchHighProfitInvoice()
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
  <div class="flex flex-col gap-4" style="height: 100%">
    <div class="flex flex-wrap items-center gap-4" style="height: 80px">
      <span style="font-size: 18px; font-weight: 500">Khách hàng mua nhiều:</span>
      <div style="width: 120px; margin-right: auto">
        <VueSelect
          v-model:value="typeBestSelling"
          :options="[
            { text: 'Số đơn', value: 'topCountInvoice' },
            { text: 'Tiền đơn', value: 'topTotalMoney' },
            { text: 'Tiền lãi', value: 'topProfit' },
          ]"
          @update:value="(e) => startFetchData()" />
      </div>
      <div>
        <a-range-picker
          v-model:value="timeRanger"
          :onChange="handleChangeTime"
          format="DD-MM-YYYY"
          :placeholder="['DD-MM-YYYY', 'DD-MM-YYYY']" />
      </div>
    </div>
    <div class="flex-1">
      <Bar v-if="loaded" :data="barData" :options="options as any" />
    </div>
  </div>
</template>
