<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { IconBarChart, IconRead } from '../../../common/icon-antd'
import { InputDate } from '../../../common/vue-form'
import VuePagination from '../../../common/VuePagination.vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Radiology, RadiologyService } from '../../../modules/radiology'
import { RadiologyStatisticService } from '../../../modules/statistics'
import { TicketRadiology, TicketRadiologyApi } from '../../../modules/ticket-radiology'
import { ESTimer } from '../../../utils'

const fromTime = ref<number>(ESTimer.startOfMonth(new Date()).getTime())
const toTime = ref<number>(ESTimer.endOfMonth(new Date()).getTime())

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const dataLoading = ref(false)

const radiologyMap = ref<Record<string, Radiology>>({})
const ticketRadiologyList = ref<TicketRadiology[]>([])
const sumCostMoney = ref<number>(0)
const sumActualMoney = ref<number>(0)

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFetchData = async () => {
  dataLoading.value = true

  TicketRadiologyApi.pagination({
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
      ticketRadiologyList.value = result.ticketRadiologyList
      total.value = result.total
    })
    .catch((error) => {
      console.log('🚀 ~ StatisticRadiology.vue:54 ~ startFetchData ~ error:', error)
    })
    .finally(() => {
      dataLoading.value = false
    })

  RadiologyStatisticService.sumMoney({
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
  RadiologyService.getMap()
    .then((result) => (radiologyMap.value = result))
    .catch((e) => console.log('🚀 ~  RadiologyService.getMap ~ e:', e))
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
</script>

<template>
  <div class="page-header">
    <div class="flex items-center gap-4">
      <div
        class="hidden md:block"
        style="font-size: 1.25rem; font-weight: 500; line-height: 1.75rem"
      >
        <IconBarChart class="mr-1" />
        Báo cáo phiếu CĐHA
      </div>
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
        <div class="card-title">Số phiếu đã làm</div>
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
            <th>Phiếu CĐHA</th>
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
          <tr v-if="ticketRadiologyList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(ticketRadiology, index) in ticketRadiologyList" :key="index">
            <td class="text-center">
              <div class="flex gap-4 justify-center">
                <router-link
                  :to="{
                    name: 'TicketClinicDetailContainer',
                    params: { roomId: 0, ticketId: ticketRadiology.ticketId },
                  }"
                >
                  <div class="flex justify-center items-center gap-2">
                    <span>T{{ ticketRadiology.ticketId }}</span>
                    <span class="text-lg"><IconRead /></span>
                  </div>
                </router-link>
              </div>
            </td>
            <td>{{ ticketRadiology.customer?.fullName }}</td>
            <td>{{ radiologyMap[ticketRadiology.radiologyId]?.name }}</td>
            <td class="text-center">
              {{ ESTimer.timeToText(ticketRadiology.startedAt, 'hh:mm DD/MM/YYYY') }}
            </td>
            <td class="text-center">
              {{ formatMoney(ticketRadiology.costPrice) }}
            </td>
            <td class="text-center">
              <div v-if="ticketRadiology.discountMoney" class="text-xs italic text-red-500">
                <del>{{ formatMoney(ticketRadiology.expectedPrice) }}</del>
              </div>
              <div>{{ formatMoney(ticketRadiology.actualPrice) }}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="p-4 flex flex-wrap justify-end gap-4">
      <VuePagination
        v-model:page="page"
        :total="total"
        :limit="limit"
        @update:page="(p: any) => changePagination({ page: p, limit })"
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
