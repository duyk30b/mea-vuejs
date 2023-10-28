<script setup lang="ts">
import { ShopOutlined } from '@ant-design/icons-vue'
import type { ChartData } from 'chart.js'
import dayjs, { type Dayjs } from 'dayjs'
import { onMounted, reactive, ref } from 'vue'
import { Bar } from 'vue-chartjs'
import { StatisticService } from '../../../modules/statistics'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { DTimer } from '../../../utils'

const screenStore = useScreenStore()
const moneyDivision = screenStore.SYSTEM_SETTING.moneyDivisionFormat
const { isMobile, formatMoney } = screenStore

const timeType = ref<'date' | 'month'>('date')

const invoiceCount = ref(0)
const receiptCount = ref(0)

const invoiceData = reactive<ChartData<'bar', (number | [number, number] | null)[], unknown>>({
  labels: [],
  datasets: [],
})

const receiptData = reactive<ChartData<'bar', (number | [number, number] | null)[], unknown>>({
  labels: [],
  datasets: [],
})

const surchargeData = reactive<ChartData<'bar', (number | [number, number] | null)[], unknown>>({
  labels: [],
  datasets: [],
})

const expenseData = reactive<ChartData<'bar', (number | [number, number] | null)[], unknown>>({
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

const startFetchReceipt = async (fromTime: Date, toTime: Date, timeType: 'date' | 'month') => {
  const data = await StatisticService.sumMoneyReceipt({
    fromTime: fromTime.toISOString(),
    toTime: toTime.toISOString(),
    timeType,
  })

  receiptCount.value = data.reduce((acc, cur) => acc + cur.countReceipt, 0)
  receiptData.labels = data.map((i) => (timeType === 'date' ? i.time.slice(0, 5) : i.time))
  receiptData.datasets = [
    {
      type: 'bar',
      label: 'Tiền nhập',
      data: data.map((i) => i.sumRevenue / moneyDivision),
      borderWidth: 1,
      stack: 'Stack 0',
    },
  ]
}

const startFetchSurchargeAndExpense = async (
  fromTime: Date,
  toTime: Date,
  timeType: 'date' | 'month'
) => {
  const data = await StatisticService.sumInvoiceSurchargeAndExpense({
    fromTime: fromTime.toISOString(),
    toTime: toTime.toISOString(),
    timeType,
  })

  const entriesSurchargeData = Object.entries(data.surcharge)
  if (entriesSurchargeData.length) {
    surchargeData.labels = Object.keys(entriesSurchargeData[0][1].data).map((i) => {
      return timeType === 'date' ? i.slice(0, 5) : i
    })
    surchargeData.datasets = Object.entries(data.surcharge).map(([key, value]) => {
      return {
        type: 'bar',
        label: value.name,
        data: Object.values(value.data).map((i) => i.sumMoney / moneyDivision),
        borderWidth: 1,
        stack: 'Stack 0',
      }
    })
  } else {
    surchargeData.labels = Array.from({ length: 20 }, (_, i) => '')
    surchargeData.datasets = [
      {
        type: 'bar',
        label: '',
        data: Array.from({ length: 20 }, (_, i) => 0),
        borderWidth: 1,
        stack: 'Stack 0',
      },
    ]
  }

  const entriesExpenseData = Object.entries(data.expense)
  if (entriesExpenseData.length) {
    expenseData.labels = Object.keys(entriesExpenseData[0][1].data).map((i) => {
      return timeType === 'date' ? i.slice(0, 5) : i
    })
    expenseData.datasets = Object.entries(data.expense).map(([key, value]) => {
      return {
        type: 'bar',
        label: value.name,
        data: Object.values(value.data).map((i) => i.sumMoney / moneyDivision),
        borderWidth: 1,
        stack: 'Stack 0',
      }
    })
  } else {
    expenseData.labels = Array.from({ length: 20 }, (_, i) => '')
    expenseData.datasets = [
      {
        type: 'bar',
        label: '',
        data: Array.from({ length: 20 }, (_, i) => 0),
        borderWidth: 1,
        stack: 'Stack 0',
      },
    ]
  }
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
    await Promise.all([
      startFetchInvoice(fromTime, toTime, timeType.value),
      startFetchReceipt(fromTime, toTime, timeType.value),
      startFetchSurchargeAndExpense(fromTime, toTime, timeType.value),
    ])
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

onMounted(async () => await startFetchData())
</script>

<template>
  <div class="page-header">
    <div class="page-header-content">
      <div class="md:block">
        <ShopOutlined />
        <span class="ml-2"> Báo cáo thu chi </span>
      </div>
    </div>
  </div>

  <div class="page-main">
    <div class="p-4">
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

      <div class="mt-5 flex flex-wrap items-stretch gap-20">
        <div style="flex: 1; height: 500px">
          <div>
            <span style="font-size: 18px; font-weight: 500">Số hóa đơn: {{ invoiceCount }} </span>
          </div>
          <Bar v-if="loaded" :data="invoiceData" :options="options as any" />
        </div>

        <div style="flex: 1; height: 500px">
          <div>
            <span style="font-size: 18px; font-weight: 500"
              >Số phiếu nhập: {{ receiptCount }}
            </span>
          </div>
          <Bar v-if="loaded" :data="receiptData" :options="options as any" />
        </div>
      </div>

      <div class="mt-20 mb-10 flex flex-wrap items-stretch gap-20">
        <div style="flex: 1; height: 500px">
          <div>
            <span style="font-size: 18px; font-weight: 500"> Phụ phí </span>
          </div>
          <Bar v-if="loaded" :data="surchargeData" :options="options as any" />
        </div>

        <div style="flex: 1; height: 500px">
          <div>
            <span style="font-size: 18px; font-weight: 500"> Chi phí </span>
          </div>
          <Bar v-if="loaded" :data="expenseData" :options="options as any" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
