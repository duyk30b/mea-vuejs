<script setup lang="ts">
import type { ChartData } from 'chart.js'
import dayjs, { type Dayjs } from 'dayjs'
import { onBeforeMount, reactive, ref } from 'vue'
import { Bar } from 'vue-chartjs'
import { StatisticService } from '../modules/statistics'
import { DTimer } from '../utils'
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
import { useOrganizationStore } from '../store/organization.store'

const organizationStore = useOrganizationStore()
const moneyDivision = organizationStore.SYSTEM_SETTING.moneyDivisionFormat

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

const timeType = ref<'date' | 'month'>('date')

const invoiceCount = ref(0)

const invoiceData = reactive<ChartData<'bar', (number | [number, number] | null)[], unknown>>({
  labels: [],
  datasets: [],
})

const options = {
  responsive: true,
  maintainAspectRatio: false,
}

const startMonth = DTimer.startOfMonth(new Date())
const endMonth = DTimer.endOfMonth(new Date())

const loaded = ref(false)
const timeRanger = ref<[Dayjs, Dayjs]>([dayjs(startMonth), dayjs(endMonth)])

const startFetchInvoice = async (fromTime: Date, toTime: Date, timeType: 'date' | 'month') => {
  const data = await StatisticService.sumMoneyInvoice({
    fromTime: fromTime.toISOString(),
    toTime: toTime.toISOString(),
    timeType,
  })

  invoiceCount.value = data.reduce((acc, cur) => acc + cur.countInvoice, 0)
  invoiceData.labels = data.map((i) => (timeType === 'date' ? i.time.slice(0, 5) : i.time))
  invoiceData.datasets = [
    {
      type: 'bar',
      label: 'Tiền cost',
      data: data.map((i) => i.sumItemsCost / moneyDivision),
      borderWidth: 1,
      stack: 'Stack 0',
    },
    {
      type: 'bar',
      label: 'Chi phí',
      data: data.map((i) => i.sumExpense / moneyDivision),
      borderWidth: 1,
      stack: 'Stack 0',
    },
    {
      type: 'bar',
      label: 'Tiền lãi',
      data: data.map((i) => i.sumProfit / moneyDivision),
      borderWidth: 1,
      stack: 'Stack 0',
    },
  ]
}

const startFetchData = async () => {
  try {
    loaded.value = false
    let fromTime: Date, toTime: Date
    if (timeType.value === 'date') {
      fromTime = DTimer.startOfDate(timeRanger.value?.[0].toISOString())
      toTime = DTimer.endOfDate(timeRanger.value?.[1].toISOString())
    } else {
      fromTime = DTimer.startOfMonth(timeRanger.value?.[0].toISOString())
      toTime = DTimer.endOfMonth(timeRanger.value?.[1].toISOString())
    }
    await Promise.all([startFetchInvoice(fromTime, toTime, timeType.value)])
  } catch (error) {
    console.log('🚀 ~ file: StatisticOrder.vue:84 ~ startFetchData ~ error:', error)
  } finally {
    loaded.value = true
  }
}

const handleChangeTime = async (value: any) => {
  console.log('🚀 ~ file: StatisticOrder.vue:103 ~ handleChangeTime ~ value:', value)
  if (!value) return
  await startFetchData()
}

const handleChangeTimeType = async (data: 'date' | 'month') => {
  timeType.value = data
  if (data === 'date') {
    timeRanger.value = [dayjs(startMonth), dayjs(endMonth)]
  }
  if (data === 'month') {
    const startYear = DTimer.startOfYear(new Date())
    const endYear = DTimer.endOfYear(new Date())
    timeRanger.value = [dayjs(startYear), dayjs(endYear)]
  }
  await startFetchData()
}

onBeforeMount(async () => await startFetchData())
</script>

<template>
  <div class="bg-white p-4">
    <div class="flex justify-end items-center">
      <a-button
        class="mr-2"
        :type="timeType === 'date' ? 'primary' : 'default'"
        @click="handleChangeTimeType('date')"
      >
        Ngày
      </a-button>
      <a-button
        class="mr-2"
        :type="timeType === 'month' ? 'primary' : 'default'"
        @click="handleChangeTimeType('month')"
      >
        Tháng
      </a-button>
      <a-range-picker
        v-if="timeType === 'date'"
        v-model:value="timeRanger"
        :onChange="handleChangeTime"
        format="DD-MM-YYYY"
        :placeholder="['DD-MM-YYYY', 'DD-MM-YYYY']"
        picker="date"
      />
      <a-range-picker
        v-if="timeType === 'month'"
        v-model:value="timeRanger"
        :onChange="handleChangeTime"
        format="MM-YYYY"
        :placeholder="['DD-MM-YYYY', 'DD-MM-YYYY']"
        picker="month"
      />
    </div>

    <div class="mt-5 mb-10 flex flex-wrap items-stretch gap-20">
      <div style="flex: 1; height: 500px">
        <div>
          <span style="font-size: 18px; font-weight: 500">Số hóa đơn: {{ invoiceCount }} </span>
        </div>
        <Bar v-if="loaded" :data="invoiceData" :options="options" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
