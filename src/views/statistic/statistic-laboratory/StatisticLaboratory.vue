<script setup lang="ts">
import { ReadOutlined, ScheduleOutlined } from '@ant-design/icons-vue'
import { onBeforeMount, ref } from 'vue'
import { IconSetting } from '../../../common/icon'
import { InputDate } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Laboratory, LaboratoryService } from '../../../modules/laboratory'
import { LaboratoryStatisticService } from '../../../modules/statistics'
import { TicketLaboratory, TicketLaboratoryApi } from '../../../modules/ticket-laboratory'
import { DTimer } from '../../../utils'

const fromTime = ref<number>(DTimer.startOfMonth(new Date()).getTime())
const toTime = ref<number>(DTimer.endOfMonth(new Date()).getTime())

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const meStore = useMeStore()

const dataLoading = ref(false)

const laboratoryMap = ref<Record<string, Laboratory>>({})
const ticketLaboratoryList = ref<TicketLaboratory[]>([])
const sumCostMoney = ref<number>(0)
const sumActualMoney = ref<number>(0)

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFetchData = async () => {
  dataLoading.value = true

  TicketLaboratoryApi.pagination({
    page: page.value,
    limit: limit.value,
    relation: {
      customer: true,
    },
    filter: {
      startedAt:
        fromTime.value || toTime.value
          ? {
              GTE: fromTime.value ? fromTime.value : undefined,
              LT: toTime.value ? toTime.value + 24 * 60 * 60 * 1000 : undefined,
            }
          : undefined,
    },
    sort: { startedAt: 'ASC' },
  })
    .then((result) => {
      ticketLaboratoryList.value = result.data
      total.value = result.meta.total
    })
    .catch((error) => {
      console.log('🚀 ~ StatisticLaboratory.vue:54 ~ startFetchData ~ error:', error)
    })
    .finally(() => {
      dataLoading.value = false
    })

  LaboratoryStatisticService.sumMoney({
    fromTime: fromTime.value ? new Date(fromTime.value).toISOString() : undefined,
    toTime: toTime.value ? new Date(toTime.value).toISOString() : undefined,
  })
    .then((result) => {
      sumCostMoney.value = result.sumCostMoney
      sumActualMoney.value = result.sumActualMoney
    })
    .catch((e) => {})
}

onBeforeMount(async () => {
  LaboratoryService.getMap()
    .then((result) => (laboratoryMap.value = result))
    .catch((e) => console.log('🚀 ~  LaboratoryService.getMap ~ e:', e))
  await startFetchData()
})

const startFilter = async () => {
  page.value = 1
  await startFetchData()
}

const handleChangeTime = async (value: any) => {
  await startFilter()
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit

  await startFetchData()
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'SCREEN_SETTING') {
    console.log('🚀 ~ StatisticLaboratory.vue:153 ~ handleMenuSettingClick ~ menu.key:', menu.key)
  }
}
</script>

<template>
  <div class="page-header">
    <div class="flex items-center gap-4">
      <div
        class="hidden md:block"
        style="font-size: 1.25rem; font-weight: 500; line-height: 1.75rem">
        <ScheduleOutlined class="mr-1" />
        Báo cáo xét nghiệm
      </div>
    </div>
    <div class="page-header-setting">
      <a-dropdown trigger="click">
        <span style="font-size: 1.2rem; cursor: pointer">
          <IconSetting />
        </span>
        <template #overlay>
          <a-menu @click="handleMenuSettingClick">
            <a-menu-item key="SCREEN_SETTING">Cài đặt hiển thị</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>

  <div class="page-main">
    <div class="page-main-options">
      <div style="flex-basis: 150px">
        <div>Từ ngày</div>
        <div>
          <InputDate
            v-model:value="fromTime"
            type-parser="number"
            class="w-full"
            @selectTime="handleChangeTime" />
        </div>
      </div>

      <div style="flex-basis: 150px">
        <div>Đến ngày</div>
        <div>
          <InputDate
            v-model:value="toTime"
            type-parser="number"
            class="w-full"
            @selectTime="handleChangeTime" />
        </div>
      </div>
    </div>

    <div class="mt-2 p-4 flex flex-wrap gap-6">
      <div class="card">
        <div class="card-title">Số XN đã làm</div>
        <div class="card-number" style="font-weight: 500">
          {{ total }}
        </div>
      </div>
      <div class="card">
        <div class="card-title">Tổng vốn</div>
        <div class="card-number" style="font-weight: 500">
          {{ formatMoney(sumCostMoney) }}
        </div>
      </div>
      <div class="card">
        <div class="card-title">Tổng thu</div>
        <div class="card-number" style="font-weight: 500">
          {{ formatMoney(sumActualMoney) }}
        </div>
      </div>
    </div>

    <div class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Phiếu</th>
            <th>Khách hàng</th>
            <th>Xét nghiệm</th>
            <th>Thời gian</th>
            <th>Giá vốn</th>
            <th>Giá bán</th>
          </tr>
        </thead>
        <tbody v-if="dataLoading">
          <tr>
            <td colspan="100">
              <div class="vue-skeleton-loading"></div>
              <div class="vue-skeleton-loading mt-2"></div>
            </td>
          </tr>
          <tr>
            <td colspan="100">
              <div class="vue-skeleton-loading"></div>
              <div class="vue-skeleton-loading mt-2"></div>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr v-if="ticketLaboratoryList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(ticketLaboratory, index) in ticketLaboratoryList" :key="index">
            <td class="text-center">
              <div class="flex gap-4 justify-center">
                <router-link
                  :to="{
                    name: 'TicketClinicDetailContainer',
                    params: { id: ticketLaboratory.ticketId },
                  }">
                  <div class="flex justify-center items-center gap-2">
                    <span>T{{ ticketLaboratory.ticketId }}</span>
                    <span class="text-lg"><ReadOutlined /></span>
                  </div>
                </router-link>
              </div>
            </td>
            <td>{{ ticketLaboratory.customer?.fullName }}</td>
            <td>{{ laboratoryMap[ticketLaboratory.laboratoryId]?.name }}</td>
            <td class="text-center">
              {{ DTimer.timeToText(ticketLaboratory.startedAt, 'hh:mm DD/MM/YYYY') }}
            </td>
            <td class="text-center">
              {{ formatMoney(ticketLaboratory.costPrice) }}
            </td>
            <td class="text-center">
              <div v-if="ticketLaboratory.discountMoney" class="text-xs italic text-red-500">
                <del>{{ formatMoney(ticketLaboratory.expectedPrice) }}</del>
              </div>
              <div>{{ formatMoney(ticketLaboratory.actualPrice) }}</div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="my-4 flex gap-4 justify-between">
        <div class=""></div>
        <a-pagination
          v-model:current="page"
          v-model:pageSize="limit"
          :total="total"
          show-size-changer
          @change="
            (page: number, pageSize: number) => changePagination({ page, limit: pageSize })
          " />
      </div>
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
