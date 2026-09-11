<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import {
  StatisticTicketApi,
  type StatisticTicketQueryTimeResponseType,
} from '@/modules/statistics/statistic-ticket.api'
import { TicketStatus } from '@/modules/ticket/ticket.type'
import { ESTimer } from '@/utils'
import type { ChartData } from 'chart.js'
import dayjs, { type Dayjs } from 'dayjs'
import { onBeforeMount, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalStatisticTicketSetting from './ModalStatisticTicketSetting.vue'

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
}

const modalStatisticTicketSetting = ref<InstanceType<typeof ModalStatisticTicketSetting>>()

const router = useRouter()
const route = useRoute()

const settingStore = useSettingStore()
const moneyDivision = settingStore.SYSTEM_SETTING.moneyDivisionFormat
const { formatMoney, isMobile } = settingStore
const { userPermission, organizationPermission } = MeService

const roomId = ref(0)

const now = new Date()
const endMonth = ESTimer.endOfMonth(now)
const startMonth = ESTimer.startOfMonth(now)
const timeRanger = ref<[Dayjs, Dayjs]>([dayjs(startMonth), dayjs(endMonth)])
const timeType = ref<'date' | 'month'>('date')
const loaded = ref(false)

const data = ref<StatisticTicketQueryTimeResponseType[]>([])

const barData = reactive<ChartData<'bar', (number | [number, number] | null)[], unknown>>({
  labels: [],
  datasets: [],
})

onBeforeMount(async () => await startFetchData())

const startFetchData = async () => {
  try {
    loaded.value = false
    let fromTime: Date, toTime: Date
    if (timeType.value === 'date') {
      fromTime = ESTimer.startOfDate(timeRanger.value?.[0].toISOString())
      toTime = ESTimer.endOfDate(timeRanger.value?.[1].toISOString())
    } else {
      fromTime = ESTimer.startOfMonth(timeRanger.value?.[0].toISOString())
      toTime = ESTimer.endOfMonth(timeRanger.value?.[1].toISOString())
    }
    data.value = await StatisticTicketApi.groupByTime({
      fromTime: fromTime.toISOString(),
      toTime: toTime.toISOString(),
      groupTimeType: timeType.value,
      filter: {
        roomId: roomId.value ? roomId.value : undefined,
        status: { NOT_IN: [TicketStatus.Schedule, TicketStatus.Draft, TicketStatus.Cancelled] },
        // status: { IN: [TicketStatus.Debt, TicketStatus.Completed] },
      },
    })

    barData.labels = data.value.map((i) =>
      timeType.value === 'date' ? i.timeLabel.slice(0, 5) : i.timeLabel,
    )
    barData.datasets = [
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
    const startYear = ESTimer.startOfYear(new Date())
    const endYear = ESTimer.endOfYear(new Date())
    timeRanger.value = [dayjs(startYear), dayjs(endYear)]
  }
  await startFetchData()
}
</script>

<template>
  <div class="mt-4">
    <div class="flex flex-wrap gap-2 items-center">
      <div class="ml-auto">
        <div>Chọn thời gian</div>
        <div class="flex justify-end items-center gap-2">
          <VueButton
            :color="timeType === 'date' ? 'blue' : 'default'"
            @click="handleChangeTimeType('date')"
          >
            Ngày
          </VueButton>
          <VueButton
            :color="timeType === 'month' ? 'blue' : 'default'"
            @click="handleChangeTimeType('month')"
          >
            Tháng
          </VueButton>
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
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
