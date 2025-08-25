<script setup lang="ts">
import { VuePagination } from '@/common'
import { CONFIG } from '@/config'
import {
  StatisticLaboratoryApi,
  type StatisticTicketLaboratoryResponseType,
} from '@/modules/statistics/statistic-laboratory.api'
import type { ChartData, ChartOptions } from 'chart.js'
import { onBeforeMount, reactive, ref } from 'vue'
import { Bar } from 'vue-chartjs'
import { InputDate, InputSelect } from '../../../common/vue-form'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { ESTimer } from '../../../utils'

const settingStore = useSettingStore()
const moneyDivision = settingStore.SYSTEM_SETTING.moneyDivisionFormat
const { isMobile, formatMoney } = settingStore

const fromTime = ref<number>(ESTimer.startOfMonth(new Date()).getTime())
const toTime = ref<number>(ESTimer.endOfMonth(new Date()).getTime())

const statisticPagination = ref<StatisticTicketLaboratoryResponseType[]>([])
const statisticTotal = ref<
  Pick<StatisticTicketLaboratoryResponseType, 'count' | 'sumActualAmount' | 'sumCostAmount'>
>({
  count: 0,
  sumActualAmount: 0,
  sumCostAmount: 0,
})
const sortKey = ref<keyof StatisticTicketLaboratoryResponseType>('count')
const sortKeyOptions = [
  { label: 'Lượt bán', value: 'count' },
  { label: 'Tiền vốn', value: 'sumCostAmount' },
  { label: 'Tiền bán', value: 'sumActualAmount' },
]

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

const page = ref(1)
const limit = ref(isMobile ? 10 : 20)
const total = ref(0)
const loaded = ref(false)

const startFetchData = async () => {
  try {
    loaded.value = false

    const fetchResponse = await StatisticLaboratoryApi.statisticTicketLaboratory({
      filter: {
        createdAt:
          fromTime.value || toTime.value
            ? {
                GTE: fromTime.value ? fromTime.value : undefined,
                LTE: toTime.value ? toTime.value + 24 * 60 * 60 * 1000 : undefined,
              }
            : undefined,
      },
      sortStatistic: { [sortKey.value]: 'DESC' },
      limit: limit.value,
      page: page.value,
    })
    statisticPagination.value = fetchResponse.statisticPagination
    statisticTotal.value = fetchResponse.statisticTotal
    total.value = fetchResponse.statisticTotal.count

    barData.labels = Array.from({ length: limit.value }, (_, i) => '')
    barData.labels.splice(
      0,
      statisticPagination.value.length,
      ...statisticPagination.value.map((i) => i.laboratory?.name),
    )

    barData.datasets = [
      {
        type: 'bar',
        label: sortKeyOptions.find((i) => i.value === sortKey.value)?.label || '',
        data: Array.from({ length: limit.value }, (_, i) => 0),
        borderWidth: 1,
        stack: 'Stack 0',
      },
    ]
    barData.datasets[0].data.splice(
      0,
      statisticPagination.value.length,
      ...statisticPagination.value.map((i) => {
        const val = i[sortKey.value]
        return val as any
      }),
    )
  } catch (error) {
    console.log('🚀 ~ StatisticTicketLaboratory.vue:112 ~ startFetchData ~ error:', error)
  } finally {
    loaded.value = true
  }
}

const handleChangeTime = async (value: any) => {
  await startFetchData()
}

const handleChangeKeyTopOption = async (option: { label: string; value: any }) => {
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

    <div class="mt-2 p-4 flex flex-wrap gap-6">
      <div class="card">
        <div class="card-title">Số XN đã làm</div>
        <div class="card-number" style="font-weight: 500">
          {{ statisticTotal.count }}
        </div>
      </div>
      <div class="card">
        <div class="card-title">Tổng vốn</div>
        <div class="card-number" style="font-weight: 500">
          {{ formatMoney(statisticTotal.sumCostAmount) }}
        </div>
      </div>
      <div class="card">
        <div class="card-title">Tổng thu</div>
        <div class="card-number" style="font-weight: 500">
          {{ formatMoney(statisticTotal.sumActualAmount) }}
        </div>
      </div>
    </div>

    <div class="mt-4 flex items-center gap-4">
      <span style="font-size: 18px; font-weight: 500">Chọn biểu đồ:</span>
      <div style="width: 150px">
        <InputSelect
          v-model:value="sortKey"
          :options="sortKeyOptions"
          @selectItem="handleChangeKeyTopOption"
        />
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
            <th v-if="CONFIG.MODE === 'development'">ID</th>
            <th>#</th>
            <th>Xét nghiệm</th>
            <th>Lượt bán</th>
            <th>Tổng vốn</th>
            <th>Tổng tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in statisticPagination" :key="index">
            <td v-if="CONFIG.MODE === 'development'" style="text-align: center; color: violet">
              {{ item.laboratoryId }}
            </td>
            <td class="text-center">{{ (page - 1) * limit + index + 1 }}</td>
            <td>{{ item.laboratory?.name }}</td>
            <td class="text-center">{{ item.count }}</td>
            <td class="text-center">{{ formatMoney(item.sumCostAmount) }}</td>
            <td class="text-right">{{ formatMoney(item.sumActualAmount) }}</td>
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

<style lang="scss" scoped>
.card {
  padding: 8px 20px;
  border: 1px solid #dedede;
  border-radius: 4px;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  width: 200px;
  @media screen and (max-width: 900px) {
    width: 45%;
  }
  .card-title {
    font-size: 12px;
    opacity: 0.8;
  }
  .card-number {
    font-size: 20px;
    font-weight: 500;
  }
}
</style>
