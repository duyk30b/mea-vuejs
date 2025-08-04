<script setup lang="ts">
import { CONFIG } from '@/config'
import { TicketProductApi, type TicketProductStatisticResponseType } from '@/modules/ticket-product'
import type { ChartData, ChartOptions } from 'chart.js'
import { onBeforeMount, reactive, ref } from 'vue'
import { Bar } from 'vue-chartjs'
import { InputDate, InputSelect, VueSelect } from '../../../common/vue-form'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { ESTimer } from '../../../utils'
import { VuePagination } from '@/common'

const settingStore = useSettingStore()
const moneyDivision = settingStore.SYSTEM_SETTING.moneyDivisionFormat
const { isMobile, formatMoney } = settingStore

const fromTime = ref<number>(ESTimer.startOfMonth(new Date()).getTime())
const toTime = ref<number>(ESTimer.endOfMonth(new Date()).getTime())

const dataStatistic = ref<TicketProductStatisticResponseType[]>([])
const barKeyTopType = ref<keyof TicketProductStatisticResponseType>('count')
const barKeyTopOptions = [
  { text: 'Lượt bán', value: 'count' },
  { text: 'Số lượng', value: 'sumQuantity' },
  { text: 'Tiền vốn', value: 'sumCostAmount' },
  { text: 'Tiền bán', value: 'sumActualAmount' },
  { text: 'Tiền lãi', value: 'sumProfitAmount' },
]
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

const page = ref(1)
const limit = ref(isMobile ? 10 : 20)
const total = ref(0)
const loaded = ref(false)

const startFetchTicketProductStatistic = async () => {
  const fetchResponse = await TicketProductApi.statisticProduct({
    filter: {
      createdAt:
        fromTime.value || toTime.value
          ? {
              GTE: fromTime.value ? fromTime.value : undefined,
              LTE: toTime.value ? toTime.value + 24 * 60 * 60 * 1000 : undefined,
            }
          : undefined,
    },
    sortStatistic: { [barKeyTopType.value]: 'DESC' },
    limit: limit.value,
    page: page.value,
  })
  dataStatistic.value = fetchResponse.dataStatistic
  total.value = fetchResponse.total

  barData.labels = Array.from({ length: limit.value }, (_, i) => '')
  barData.datasets = [
    {
      type: 'bar',
      label: barKeyTopOptions.find((i) => i.value === barKeyTopType.value)?.text || '',
      data: Array.from({ length: limit.value }, (_, i) => 0),
      borderWidth: 1,
      stack: 'Stack 0',
    },
  ]
  barData.labels.splice(
    0,
    dataStatistic.value.length,
    ...dataStatistic.value.map((i) => i.product.brandName),
  )
  barData.datasets[0].data.splice(
    0,
    dataStatistic.value.length,
    ...dataStatistic.value.map((i) => {
      const val = i[barKeyTopType.value]
      return val as any
    }),
  )
}

const startFetchData = async () => {
  try {
    loaded.value = false
    await startFetchTicketProductStatistic()
  } catch (error) {
  } finally {
    loaded.value = true
  }
}

const handleChangeTime = async (value: any) => {
  await startFetchData()
}

const handleChangeOptionBar = async (option: { text?: string; value?: any }) => {
  await startFetchData()
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  await startFetchData()
}

onBeforeMount(async () => await startFetchData())
</script>

<template>
  <div class="mt-4">
    <div class="flex justify-end gap-4">
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
    <div class="mt-4 flex items-center gap-4">
      <span style="font-size: 18px; font-weight: 500">Chọn biểu đồ:</span>
      <div style="width: 150px">
        <VueSelect
          v-model:value="barKeyTopType"
          :options="barKeyTopOptions"
          @selectItem="handleChangeOptionBar"
        />
      </div>
    </div>
    <div style="height: 500px">
      <Bar v-if="loaded" :data="barData" :options="options as any" />
    </div>

    <div class="mt-4 table-wrapper">
      <div class="text-lg" style="font-weight: 500">Thông số chi tiết</div>
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'">ID</th>
            <th>#</th>
            <th>Sản phẩm</th>
            <th>Lượt bán</th>
            <th>Số lượng</th>
            <th>Tổng vốn</th>
            <th>Tổng tiền bán</th>
            <th>Tổng lãi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in dataStatistic" :key="index">
            <td v-if="CONFIG.MODE === 'development'" style="text-align: center; color: violet">
              {{ item.productId }}
            </td>
            <td class="text-center">{{ (page - 1) * limit + index + 1 }}</td>
            <td>{{ item.product?.brandName }}</td>
            <td class="text-center">{{ item.count }}</td>
            <td class="text-center">{{ item.sumQuantity }}</td>
            <td class="text-right">{{ formatMoney(item.sumCostAmount) }}</td>
            <td class="text-right">{{ formatMoney(item.sumActualAmount) }}</td>
            <td class="text-right">{{ formatMoney(item.sumProfitAmount) }}</td>
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
