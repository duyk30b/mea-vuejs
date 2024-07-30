<script setup lang="ts">
import { ShopOutlined } from '@ant-design/icons-vue'
import type { ChartData } from 'chart.js'
import dayjs, { type Dayjs } from 'dayjs'
import { nextTick, onBeforeMount, reactive, ref } from 'vue'
import { Bar } from 'vue-chartjs'
import VueButton from '../../../common/VueButton.vue'
import { VueSelect } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { VoucherType } from '../../../modules/enum'
import { StatisticService } from '../../../modules/statistics'
import { DTimer } from '../../../utils'
import { PermissionId } from '../../../modules/permission/permission.enum'

type DataResponseType = {
  timeLabel: string
  sumTotalCostAmount: number
  sumProceduresMoney: number
  sumProductsMoney: number
  sumRadiologyMoney: number
  sumSurcharge: number
  sumExpense: number
  sumDiscountMoney: number
  sumTotalMoney: number
  sumProfit: number
  sumDebt: number
  countTicket: number
}

const options = {
  responsive: true,
  maintainAspectRatio: false,
}

const settingStore = useSettingStore()
const moneyDivision = settingStore.SYSTEM_SETTING.moneyDivisionFormat
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const now = new Date()
const endMonth = DTimer.endOfMonth(now)
const startMonth = DTimer.startOfMonth(now)
const voucherType = ref<VoucherType | null>(null)
const timeRanger = ref<[Dayjs, Dayjs]>([dayjs(startMonth), dayjs(endMonth)])
const timeType = ref<'date' | 'month'>('date')
const loaded = ref(false)

const data = ref<DataResponseType[]>([])

const visitBarData = reactive<ChartData<'bar', (number | [number, number] | null)[], unknown>>({
  labels: [],
  datasets: [],
})
const visitBarOption = ref<keyof DataResponseType>('sumTotalMoney')

onBeforeMount(async () => await startFetchData())

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
    data.value = await StatisticService.statisticTicket({
      voucherType: voucherType.value ?? undefined,
      fromTime: fromTime.toISOString(),
      toTime: toTime.toISOString(),
      timeType: timeType.value,
    })

    visitBarData.labels = data.value.map((i) =>
      timeType.value === 'date' ? i.timeLabel.slice(0, 5) : i.timeLabel
    )
    visitBarData.datasets = [
      {
        type: 'bar',
        label: 'Tổng tiền',
        data: data.value.map((i) => i.sumTotalMoney / moneyDivision),
        borderWidth: 1,
        stack: 'Stack 0',
      },
    ]
  } catch (error) {
    console.log('🚀 ~ file: StatisticVisit.vue:49 ~ startFetchData ~ error:', error)
  } finally {
    loaded.value = true
  }
}

const handleChangeTime = async (value: any) => {
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

const handleChangeOptionBar = async (option: { text?: string; value?: any }) => {
  loaded.value = false
  visitBarData.datasets = [
    {
      type: 'bar',
      label: option.text!,
      data: data.value.map((i: any) => i[option.value!] / moneyDivision),
      borderWidth: 1,
      stack: 'Stack 0',
    },
  ]
  await nextTick()
  loaded.value = true
}
</script>

<template>
  <div class="page-header">
    <div class="page-header-content">
      <div class="md:block">
        <ShopOutlined />
        <span class="ml-2">Báo cáo bán hàng</span>
      </div>
    </div>
  </div>

  <div class="page-main p-4">
    <div class="flex flex-wrap gap-2 justify-between items-center">
      <div style="width: 150px">
        <div>Chọn loại phiếu</div>
        <div>
          <VueSelect
            v-model:value="voucherType"
            :options="[
              { value: null, text: 'Tất cả' },
              ...(permissionIdMap[PermissionId.TICKET_ORDER_READ]
                ? [{ value: VoucherType.Order, text: 'Bán hàng' }]
                : []),
              ...(permissionIdMap[PermissionId.TICKET_CLINIC_READ]
                ? [{ value: VoucherType.Clinic, text: 'Phiếu khám' }]
                : []),
            ]"
            @update:value="startFetchData" />
        </div>
      </div>
      <div>
        <div>Chọn thời gian</div>
        <div class="flex justify-end items-center gap-2">
          <VueButton
            :color="timeType === 'date' ? 'blue' : 'default'"
            @click="handleChangeTimeType('date')">
            Ngày
          </VueButton>
          <VueButton
            :color="timeType === 'month' ? 'blue' : 'default'"
            @click="handleChangeTimeType('month')">
            Tháng
          </VueButton>
          <a-range-picker
            v-if="timeType === 'date'"
            v-model:value="timeRanger"
            :onChange="handleChangeTime"
            format="DD-MM-YYYY"
            :placeholder="['DD-MM-YYYY', 'DD-MM-YYYY']"
            picker="date" />
          <a-range-picker
            v-if="timeType === 'month'"
            v-model:value="timeRanger"
            :onChange="handleChangeTime"
            format="MM-YYYY"
            :placeholder="['DD-MM-YYYY', 'DD-MM-YYYY']"
            picker="month" />
        </div>
      </div>
    </div>

    <div class="mt-4" style="font-size: 18px; font-weight: 500">Thông số trong kỳ:</div>
    <div class="mt-2 flex flex-wrap">
      <div class="card">
        <div class="card-title">Tổng số đơn</div>
        <div class="card-number" style="font-weight: 500">
          {{ formatMoney(data.reduce((acc, item) => acc + item.countTicket, 0)) }}
        </div>
      </div>
      <div class="card">
        <div class="card-title">Tổng tiền</div>
        <div class="card-number" style="font-weight: 500">
          {{ formatMoney(data.reduce((acc, item) => acc + item.sumTotalMoney, 0)) }}
        </div>
      </div>
      <div class="card">
        <div class="card-title">Tổng vốn</div>
        <div class="card-number" style="font-weight: 500">
          {{ formatMoney(data.reduce((acc, item) => acc + item.sumTotalCostAmount, 0)) }}
        </div>
      </div>

      <div class="card">
        <div class="card-title">Tổng phụ phí</div>
        <div class="card-number" style="font-weight: 500">
          {{ formatMoney(data.reduce((acc, item) => acc + item.sumSurcharge, 0)) }}
        </div>
      </div>
      <div class="card">
        <div class="card-title">Tổng chi phí</div>
        <div class="card-number" style="font-weight: 500">
          {{ formatMoney(data.reduce((acc, item) => acc + item.sumExpense, 0)) }}
        </div>
      </div>
      <div class="card">
        <div class="card-title">Tổng lãi</div>
        <div class="card-number" style="font-weight: 500">
          {{ formatMoney(data.reduce((acc, item) => acc + item.sumProfit, 0)) }}
        </div>
      </div>
      <div class="card">
        <div class="card-title">Tổng nợ</div>
        <div class="card-number" style="font-weight: 500">
          {{ formatMoney(data.reduce((acc, item) => acc + item.sumDebt, 0)) }}
        </div>
      </div>
    </div>

    <div class="mt-10 flex items-center gap-4">
      <span style="font-size: 18px; font-weight: 500">Chọn biểu đồ:</span>
      <div style="width: 150px">
        <VueSelect
          v-model:value="visitBarOption"
          :options="[
            { text: 'Tổng tiền', value: 'sumTotalMoney' },
            { text: 'Tổng vốn', value: 'sumTotalCostAmount' },
            { text: 'Tổng phụ phí', value: 'sumSurcharge' },
            { text: 'Tổng chi phí', value: 'sumExpense' },
            { text: 'Tổng lãi', value: 'sumProfit' },
            { text: 'Tổng nợ', value: 'sumDebt' },
            { text: 'Số đơn', value: 'countTicket' },
          ]"
          @selectItem="handleChangeOptionBar" />
      </div>
    </div>
    <div style="height: 500px">
      <Bar v-if="loaded" :data="visitBarData" :options="options" />
    </div>

    <div class="mt-8 table-wrapper">
      <div class="text-lg" style="font-weight: 500">Thông số chi tiết</div>
      <table>
        <thead>
          <tr>
            <th>T.Gian</th>
            <th>Số đơn</th>
            <th>Tổng tiền</th>
            <th>Tiền sản phẩm</th>
            <th>Tiền dịch vụ</th>
            <th>Tiền CĐHA</th>
            <th>Tổng vốn</th>
            <th>Tổng phụ phí</th>
            <th>Tổng chi phí</th>
            <th>Tổng lãi</th>
            <th>Tổng nợ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in data" :key="index">
            <td class="text-center">{{ item.timeLabel }}</td>
            <td class="text-center">{{ formatMoney(item.countTicket) }}</td>
            <td class="text-right">{{ formatMoney(item.sumTotalMoney) }}</td>
            <td class="text-right">{{ formatMoney(item.sumProductsMoney) }}</td>
            <td class="text-right">{{ formatMoney(item.sumProceduresMoney) }}</td>
            <td class="text-right">{{ formatMoney(item.sumRadiologyMoney) }}</td>
            <td class="text-right">{{ formatMoney(item.sumTotalCostAmount) }}</td>
            <td class="text-right">{{ formatMoney(item.sumSurcharge) }}</td>
            <td class="text-right">{{ formatMoney(item.sumExpense) }}</td>
            <td class="text-right">{{ formatMoney(item.sumProfit) }}</td>
            <td class="text-right">{{ formatMoney(item.sumDebt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.card {
  margin: 10px auto;
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
