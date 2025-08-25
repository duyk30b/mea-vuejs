<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconBarChart, IconSetting } from '@/common/icon-antd'
import { IconDownload } from '@/common/icon-google'
import VueDropdown from '@/common/popover/VueDropdown.vue'
import { VueSelect } from '@/common/vue-form'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { FileTicketApi } from '@/modules/file-excel/file-ticket.api'
import { PermissionId } from '@/modules/permission/permission.enum'
import { RoomType } from '@/modules/room'
import { StatisticTicketApi } from '@/modules/statistics/statistic-ticket.api'
import { TicketStatus } from '@/modules/ticket'
import { ESTimer } from '@/utils'
import InputSelectRoom from '@/views/component/InputSelectRoom.vue'
import type { ChartData } from 'chart.js'
import dayjs, { type Dayjs } from 'dayjs'
import { nextTick, onBeforeMount, reactive, ref } from 'vue'
import { Bar } from 'vue-chartjs'
import { useRoute, useRouter } from 'vue-router'
import ModalStatisticTicketSetting from './ModalStatisticTicketSetting.vue'

type DataResponseType = {
  timeLabel: string
  sumTotalCostAmount: number
  sumProcedureMoney: number
  sumProductMoney: number
  sumRadiologyMoney: number
  sumLaboratoryMoney: number
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
      fromTime = ESTimer.startOfDate(timeRanger.value?.[0].toISOString())
      toTime = ESTimer.endOfDate(timeRanger.value?.[1].toISOString())
    } else {
      fromTime = ESTimer.startOfMonth(timeRanger.value?.[0].toISOString())
      toTime = ESTimer.endOfMonth(timeRanger.value?.[1].toISOString())
    }
    data.value = await StatisticTicketApi.statisticTicket({
      fromTime: fromTime.toISOString(),
      toTime: toTime.toISOString(),
      groupTimeType: timeType.value,
      filter: {
        roomId: roomId.value ? roomId.value : undefined,
        status: { IN: [TicketStatus.Debt, TicketStatus.Completed] },
      },
    })

    visitBarData.labels = data.value.map((i) =>
      timeType.value === 'date' ? i.timeLabel.slice(0, 5) : i.timeLabel,
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
    const startYear = ESTimer.startOfYear(new Date())
    const endYear = ESTimer.endOfYear(new Date())
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

const downloadTicketList = (menu: { key: string }) => {
  ModalStore.confirm({
    title: 'Xác nhận tải file báo cáo',
    content: 'Thời gian tải file có thể tốn vài phút nếu dữ liệu lớn, bạn vẫn mốn tải ?',
    onOk: async () => {
      let fromTime: number, toTime: number
      if (timeType.value === 'date') {
        fromTime = ESTimer.startOfDate(timeRanger.value?.[0].toISOString()).getTime()
        toTime = ESTimer.endOfDate(timeRanger.value?.[1].toISOString()).getTime()
      } else {
        fromTime = ESTimer.startOfMonth(timeRanger.value?.[0].toISOString()).getTime()
        toTime = ESTimer.endOfMonth(timeRanger.value?.[1].toISOString()).getTime()
      }
      await FileTicketApi.downloadExcelTicketList({
        filter: {
          roomId: roomId.value ? roomId.value : undefined,
          registeredAt:
            fromTime || toTime
              ? { GTE: fromTime ? fromTime : undefined, LTE: toTime ? toTime : undefined }
              : undefined,
        },
        sort: { id: 'DESC' },
      })
    },
  })
}
</script>

<template>
  <ModalStatisticTicketSetting
    v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalStatisticTicketSetting"
  />
  <div class="page-header">
    <div class="page-header-content">
      <div class="md:block">
        <IconBarChart />
        <span class="ml-2">Báo cáo lượt tiếp đón</span>
      </div>
    </div>

    <div class="mr-2 flex items-center gap-8">
      <VueDropdown>
        <template #trigger>
          <span style="font-size: 1.2rem; cursor: pointer">
            <IconSetting />
          </span>
        </template>
        <div class="vue-menu">
          <a
            v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
            @click="modalStatisticTicketSetting?.openModal()"
          >
            Cài đặt hiển thị
          </a>
        </div>
      </VueDropdown>
    </div>
  </div>

  <div class="page-main p-4">
    <div class="flex flex-wrap gap-2 items-center">
      <div style="width: 150px">
        <div>Chọn phòng</div>
        <div>
          <InputSelectRoom
            v-model:roomId="roomId"
            :roomType="RoomType.Ticket"
            removeLabelWrapper
            optionZero
            @update:roomId="startFetchData"
          />
        </div>
      </div>
      <div style="width: 150px">
        <div>&nbsp;</div>
        <div>
          <VueButton
            v-if="userPermission[PermissionId.FILE_EXCEL_DOWNLOAD_TICKET_CLINIC]"
            :icon="IconDownload"
            color="blue"
            @click="downloadTicketList"
          >
            Download
          </VueButton>
        </div>
      </div>
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

    <div class="mt-4" style="font-size: 18px; font-weight: 500">Thông số trong kỳ:</div>
    <div class="mt-2 flex flex-wrap">
      <div class="card">
        <div class="card-title">Tổng số phiếu</div>
        <div class="card-number" style="font-weight: 500">
          {{ formatMoney(data.reduce((acc, item) => acc + item.countTicket, 0)) }}
        </div>
      </div>
      <div class="card">
        <div class="card-title">Tổng doanh thu</div>
        <div class="card-number" style="font-weight: 500">
          {{ formatMoney(data.reduce((acc, item) => acc + item.sumTotalMoney, 0)) }}
        </div>
      </div>
      <div v-if="settingStore.TICKET_STATISTIC.sumTotalCostAmount" class="card">
        <div class="card-title">Tổng vốn</div>
        <div class="card-number" style="font-weight: 500">
          {{ formatMoney(data.reduce((acc, item) => acc + item.sumTotalCostAmount, 0)) }}
        </div>
      </div>
      <div
        v-if="settingStore.TICKET_STATISTIC.sumProcedureMoney"
        class="card cursor-pointer"
        @click="router.push({ name: 'StatisticProcedure' })"
      >
        <div class="card-title">Tổng tiền dịch vụ</div>
        <div class="card-number" style="font-weight: 500">
          {{ formatMoney(data.reduce((acc, item) => acc + item.sumProcedureMoney, 0)) }}
        </div>
      </div>
      <div
        v-if="settingStore.TICKET_STATISTIC.sumProductMoney"
        class="card cursor-pointer"
        @click="router.push({ name: 'StatisticProduct' })"
      >
        <div class="card-title">Tổng tiền sản phẩm</div>
        <div class="card-number" style="font-weight: 500">
          {{ formatMoney(data.reduce((acc, item) => acc + item.sumProductMoney, 0)) }}
        </div>
      </div>
      <div v-if="settingStore.TICKET_STATISTIC.sumLaboratoryMoney" class="card">
        <div class="card-title">Tổng tiền xét nghiệm</div>
        <div class="card-number" style="font-weight: 500">
          {{ formatMoney(data.reduce((acc, item) => acc + item.sumLaboratoryMoney, 0)) }}
        </div>
      </div>
      <div v-if="settingStore.TICKET_STATISTIC.sumRadiologyMoney" class="card">
        <div class="card-title">Tổng tiền CĐHA</div>
        <div class="card-number" style="font-weight: 500">
          {{ formatMoney(data.reduce((acc, item) => acc + item.sumRadiologyMoney, 0)) }}
        </div>
      </div>
      <div v-if="settingStore.TICKET_STATISTIC.sumSurcharge" class="card">
        <div class="card-title">Tổng phụ phí</div>
        <div class="card-number" style="font-weight: 500">
          {{ formatMoney(data.reduce((acc, item) => acc + item.sumSurcharge, 0)) }}
        </div>
      </div>
      <div v-if="settingStore.TICKET_STATISTIC.sumExpense" class="card">
        <div class="card-title">Tổng chi phí</div>
        <div class="card-number" style="font-weight: 500">
          {{ formatMoney(data.reduce((acc, item) => acc + item.sumExpense, 0)) }}
        </div>
      </div>
      <div v-if="settingStore.TICKET_STATISTIC.sumDiscountMoney" class="card">
        <div class="card-title">Tổng khuyến mại</div>
        <div class="card-number" style="font-weight: 500">
          {{ formatMoney(data.reduce((acc, item) => acc + item.sumDiscountMoney, 0)) }}
        </div>
      </div>
      <div v-if="settingStore.TICKET_STATISTIC.sumProfit" class="card">
        <div class="card-title">Tổng lãi</div>
        <div class="card-number" style="font-weight: 500">
          {{ formatMoney(data.reduce((acc, item) => acc + item.sumProfit, 0)) }}
        </div>
      </div>
      <div v-if="settingStore.TICKET_STATISTIC.sumDebt" class="card">
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
          @selectItem="handleChangeOptionBar"
        />
      </div>
    </div>
    <div style="height: 500px">
      <Bar v-if="loaded" :data="visitBarData" :options="options" />
    </div>

    <div class="mt-8 table-wrapper">
      <div class="flex justify-between items-baseline">
        <div class="text-lg" style="font-weight: 500">Thông số chi tiết</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>T.Gian</th>
            <th v-if="settingStore.TICKET_STATISTIC.countTicket">Số đơn</th>
            <th v-if="settingStore.TICKET_STATISTIC.sumTotalMoney">Tổng tiền</th>
            <th v-if="settingStore.TICKET_STATISTIC.sumTotalCostAmount">Tổng vốn</th>
            <th v-if="settingStore.TICKET_STATISTIC.sumProductMoney">Tiền sản phẩm</th>
            <th v-if="settingStore.TICKET_STATISTIC.sumProcedureMoney">Tiền dịch vụ</th>
            <th v-if="settingStore.TICKET_STATISTIC.sumLaboratoryMoney">Tiền xét nghiệm</th>
            <th v-if="settingStore.TICKET_STATISTIC.sumRadiologyMoney">Tiền CĐHA</th>
            <th v-if="settingStore.TICKET_STATISTIC.sumSurcharge">Tổng phụ phí</th>
            <th v-if="settingStore.TICKET_STATISTIC.sumExpense">Tổng chi phí</th>
            <th v-if="settingStore.TICKET_STATISTIC.sumDiscountMoney">Tổng khuyến mại</th>
            <th v-if="settingStore.TICKET_STATISTIC.sumProfit">Tổng lãi</th>
            <th v-if="settingStore.TICKET_STATISTIC.sumDebt">Tổng nợ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in data" :key="index">
            <td class="text-center">{{ item.timeLabel }}</td>
            <td v-if="settingStore.TICKET_STATISTIC.countTicket" class="text-center">
              {{ formatMoney(item.countTicket) }}
            </td>
            <td v-if="settingStore.TICKET_STATISTIC.sumTotalMoney" class="text-right">
              {{ formatMoney(item.sumTotalMoney) }}
            </td>
            <td v-if="settingStore.TICKET_STATISTIC.sumTotalCostAmount" class="text-right">
              {{ formatMoney(item.sumTotalCostAmount) }}
            </td>
            <td v-if="settingStore.TICKET_STATISTIC.sumProductMoney" class="text-right">
              {{ formatMoney(item.sumProductMoney) }}
            </td>
            <td v-if="settingStore.TICKET_STATISTIC.sumProcedureMoney" class="text-right">
              {{ formatMoney(item.sumProcedureMoney) }}
            </td>
            <td v-if="settingStore.TICKET_STATISTIC.sumLaboratoryMoney" class="text-right">
              {{ formatMoney(item.sumLaboratoryMoney) }}
            </td>
            <td v-if="settingStore.TICKET_STATISTIC.sumRadiologyMoney" class="text-right">
              {{ formatMoney(item.sumRadiologyMoney) }}
            </td>
            <td v-if="settingStore.TICKET_STATISTIC.sumSurcharge" class="text-right">
              {{ formatMoney(item.sumSurcharge) }}
            </td>
            <td v-if="settingStore.TICKET_STATISTIC.sumExpense" class="text-right">
              {{ formatMoney(item.sumExpense) }}
            </td>
            <td v-if="settingStore.TICKET_STATISTIC.sumDiscountMoney" class="text-right">
              {{ formatMoney(item.sumDiscountMoney) }}
            </td>
            <td v-if="settingStore.TICKET_STATISTIC.sumProfit" class="text-right">
              {{ formatMoney(item.sumProfit) }}
            </td>
            <td v-if="settingStore.TICKET_STATISTIC.sumDebt" class="text-right">
              {{ formatMoney(item.sumDebt) }}
            </td>
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
