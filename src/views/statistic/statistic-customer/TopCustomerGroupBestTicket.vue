<script setup lang="ts">
import { VuePagination } from '@/common'
import { InputDate, InputSelect } from '@/common/vue-form'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import {
  StatisticTicketApi,
  StatisticTicketQuery,
  type StatisticTicketQueryCustomerGroupResponseType,
} from '@/modules/statistics'
import { TicketStatus } from '@/modules/ticket'
import { ESTimer } from '@/utils'
import { BugDevelopment } from '@/views/component'
import type { ChartData, ChartOptions } from 'chart.js'
import { onBeforeMount, reactive, ref } from 'vue'
import { Bar } from 'vue-chartjs'

const settingStore = useSettingStore()
const moneyDivision = settingStore.SYSTEM_SETTING.moneyDivisionFormat
const { isMobile, formatMoney } = settingStore

const barData = reactive<ChartData<'bar', (number | [number, number] | null)[], unknown>>({
  labels: [],
  datasets: [],
})

const barOptions: ChartOptions = {
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

const loaded = ref(false)
const typeBestSelling = ref<'topCountInvoice' | 'topTotalMoney' | 'topProfit' | 'topSumDebt'>(
  'topTotalMoney',
)

const statisticData = ref<StatisticTicketQueryCustomerGroupResponseType[]>([])
const fromTime = ref<number>(ESTimer.startOfMonth(new Date()).getTime())
const toTime = ref<number>(ESTimer.endOfMonth(new Date()).getTime())
const page = ref(1)
const limit = ref(20)
const total = ref(0)

const startFetchStatisticTicketGroupByCustomer = async (options: {
  sortStatistic: StatisticTicketQuery['sortStatistic']
}) => {
  const { sortStatistic } = options

  const fetchResponse = await StatisticTicketApi.groupByCustomerGroup({
    filter: {
      createdAt:
        fromTime.value || toTime.value
          ? {
              GTE: fromTime.value ? fromTime.value : undefined,
              LTE: toTime.value ? toTime.value + 24 * 60 * 60 * 1000 : undefined,
            }
          : undefined,
      status: { IN: [TicketStatus.Debt, TicketStatus.Completed] },
    },
    page: page.value,
    limit: limit.value,
    sortStatistic,
  })
  statisticData.value = fetchResponse.statisticData
  barData.labels = Array.from({ length: limit.value }, (_, i) => '')
  barData.labels.splice(
    0,
    statisticData.value.length,
    ...statisticData.value.map((i) => `${i.customerGroup?.name} (${i.countTicket} đơn)`),
  )
  barData.datasets = [
    {
      type: 'bar',
      label: 'Số đơn',
      data: Array.from({ length: limit.value }, (_, i) => 0),
      borderWidth: 1,
      stack: 'Stack 0',
    },
  ]

  if (sortStatistic?.countTicket) {
    barData.datasets.forEach((i) => (i.label = 'Số đơn'))
    barData.datasets[0].data.splice(
      0,
      statisticData.value.length,
      ...statisticData.value.map((i) => i.countTicket),
    )
  }

  if (sortStatistic?.sumTotalMoney) {
    barData.datasets.forEach((i) => (i.label = 'Tiền đơn'))
    barData.datasets[0].data.splice(
      0,
      statisticData.value.length,
      ...statisticData.value.map((i) => i.sumTotalMoney / moneyDivision),
    )
  }

  if (sortStatistic?.sumProfit) {
    barData.datasets.forEach((i) => (i.label = 'Tiền lãi'))
    barData.datasets[0].data.splice(
      0,
      statisticData.value.length,
      ...statisticData.value.map((i) => i.sumProfit / moneyDivision),
    )
  }

  if (sortStatistic?.sumDebtTotal) {
    barData.datasets.forEach((i) => (i.label = 'Nợ trong kỳ'))
    barData.datasets[0].data.splice(
      0,
      statisticData.value.length,
      ...statisticData.value.map((i) => i.sumDebtTotal / moneyDivision),
    )
  }
}

const startFetchData = async () => {
  try {
    loaded.value = false
    const sortStatistic: StatisticTicketQuery['sortStatistic'] = {}
    if (typeBestSelling.value === 'topCountInvoice') {
      sortStatistic.countTicket = 'DESC'
    } else if (typeBestSelling.value === 'topTotalMoney') {
      sortStatistic.sumTotalMoney = 'DESC'
    } else if (typeBestSelling.value === 'topProfit') {
      sortStatistic.sumProfit = 'DESC'
    } else if (typeBestSelling.value === 'topSumDebt') {
      sortStatistic.sumDebtTotal = 'DESC'
    }
    await startFetchStatisticTicketGroupByCustomer({ sortStatistic })
  } catch (error) {
    console.log('🚀 ~ TopCustomerBestTicket.vue:177 ~ startFetchData ~ error:', error)
  } finally {
    loaded.value = true
  }
}

const handleChangeTime = async (value: any) => {
  await startFetchData()
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  await startFetchData()
}

onBeforeMount(async () => await startFetchData())
</script>

<template>
  <div class="flex flex-col gap-4" style="height: 100%">
    <div class="flex flex-wrap items-center gap-4" style="height: 80px">
      <span style="font-size: 18px; font-weight: 500">Khách hàng mua nhiều:</span>
      <div style="width: 120px; margin-right: auto">
        <InputSelect
          v-model:value="typeBestSelling"
          :options="[
            { label: 'Số đơn', value: 'topCountInvoice' },
            { label: 'Tiền đơn', value: 'topTotalMoney' },
            { label: 'Tiền lãi', value: 'topProfit' },
            { label: 'Nợ trong kỳ', value: 'topSumDebt' },
          ]"
          @update:value="(e) => startFetchData()"
        />
      </div>
      <div class="flex items-center gap-4">
        <div style="flex-basis: 150px">
          <div>Từ ngày</div>
          <div>
            <InputDate
              v-model:value="fromTime"
              type-parser="number"
              class="w-full"
              @selectTime="handleChangeTime"
            />
          </div>
        </div>

        <div style="flex-basis: 150px">
          <div>Đến ngày</div>
          <div>
            <InputDate
              v-model:value="toTime"
              type-parser="number"
              class="w-full"
              @selectTime="handleChangeTime"
            />
          </div>
        </div>
      </div>
    </div>
    <div style="height: 500px">
      <Bar v-if="loaded" :data="barData" :options="barOptions as any" />
    </div>

    <div class="mt-4 table-wrapper">
      <div class="text-lg" style="font-weight: 500">Thông số chi tiết</div>
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'"></th>
            <th>#</th>
            <th>Nhóm khách hàng</th>
            <th>Lượt mua</th>
            <th>Tổng tiền</th>
            <th>Nợ trong kỳ</th>
            <th>Tổng lãi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in statisticData" :key="index">
            <td v-if="CONFIG.MODE === 'development'" style="text-align: center">
              <BugDevelopment :data="item" />
            </td>
            <td class="text-center">{{ (page - 1) * limit + index + 1 }}</td>
            <td>{{ item.customerGroup?.name }}</td>
            <td class="text-center">{{ item.countTicket }}</td>
            <td class="text-right">{{ formatMoney(item.sumTotalMoney) }}</td>
            <td class="text-right">{{ formatMoney(item.sumDebtTotal) }}</td>
            <td class="text-right">{{ formatMoney(item.sumProfit) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="p-4 flex flex-wrap justify-end gap-4">
      <VuePagination
        class="ml-auto"
        v-model:page="page"
        :total="total"
        :limit="limit"
        @update:page="(p: any) => changePagination({ page: p, limit })"
      />
      <InputSelect
        v-model:value="limit"
        @update:value="(l: any) => changePagination({ page, limit: l })"
        :options="[
          { value: 10, label: '10 / page' },
          { value: 20, label: '20 / page' },
          { value: 50, label: '50 / page' },
          { value: 100, label: '100 / page' },
        ]"
      />
    </div>
  </div>
</template>
