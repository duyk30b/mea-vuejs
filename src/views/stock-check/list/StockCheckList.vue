<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { VueButton } from '../../../common'
import VuePagination from '../../../common/VuePagination.vue'
import { IconSort, IconSortDown, IconSortUp } from '../../../common/icon-font-awesome'
import { IconVisibility } from '../../../common/icon-google'
import { InputDate, InputSelect, VueSelect } from '../../../common/vue-form'
import { MeService } from '../../../modules/_me/me.service'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import {
  StockCheck,
  StockCheckApi,
  StockCheckStatus,
  StockCheckStatusText,
} from '../../../modules/stock-check'
import { ESTimer, ESTypescript, timeToText } from '../../../utils'
import { Breadcrumb } from '../../component'
import StockCheckStatusTag from '../StockCheckStatusTag.vue'

const settingStore = useSettingStore()
const { userPermission } = MeService

const stockCheckList = ref<StockCheck[]>([])

const dataLoading = ref(false)
const page = ref(1)
const limit = ref(Number(localStorage.getItem('STOCK_CHECK_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const stockCheckStatus = ref<StockCheckStatus | null>(null)
const fromTime = ref<number>()
const toTime = ref<number>()

const sortColumn = ref<'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const stockCheckStatusOptions = ESTypescript.keysEnum(StockCheckStatus).map((key) => {
  return { value: StockCheckStatus[key], text: StockCheckStatusText[StockCheckStatus[key]] }
})

const startFetchData = async () => {
  try {
    dataLoading.value = true

    const { data, meta } = await StockCheckApi.pagination({
      relation: {
        createdByUser: true,
        updatedByUser: false,
        stockCheckItemList: false,
      },
      filter: {
        createdAt:
          fromTime.value || toTime.value
            ? {
                GTE: fromTime.value ? ESTimer.startOfDate(fromTime.value) : undefined,
                LT: toTime.value ? ESTimer.endOfDate(toTime.value) : undefined,
              }
            : undefined,
        status: stockCheckStatus.value !== null ? stockCheckStatus.value : undefined,
      },
      page: page.value,
      limit: limit.value,
      sort: sortValue.value
        ? { id: sortColumn.value === 'id' ? sortValue.value : undefined }
        : { id: 'DESC' },
    })

    stockCheckList.value = data
    total.value = meta.total
    dataLoading.value = false
  } catch (error) {
    console.log('🚀 ~ StockCheckList.vue:73 ~ startFetchData ~ error:', error)
  }
}

onBeforeMount(async () => {
  await startFetchData()
})

const startSearch = async () => {
  page.value = 1
  await startFetchData()
}

const handleChangeTime = async (value: any) => {
  await startFetchData()
}

const changeSort = async (column: 'id') => {
  if (sortValue.value == 'DESC') {
    sortColumn.value = ''
    sortValue.value = ''
  } else if (sortValue.value == 'ASC') {
    sortColumn.value = column
    sortValue.value = 'DESC'
  } else {
    sortColumn.value = column
    sortValue.value = 'ASC'
  }
  await startSearch()
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('STOCK_CHECK_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}
</script>

<template>
  <div class="mx-4 mt-4 gap-2 flex items-center">
    <div class="hidden md:flex gap-2 items-center text-lg font-medium">
      <Breadcrumb />
    </div>
    <div>
      <VueButton
        v-if="userPermission[PermissionId.STOCK_CHECK_DRAFT_CRUD]"
        color="blue"
        icon="plus"
        @click="$router.push({ name: 'StockCheckUpsert' })"
      >
        Tạo phiếu kiểm hàng mới
      </VueButton>
    </div>
    <div class="ml-auto flex items-center gap-4 flex-wrap"></div>
  </div>

  <div class="page-main">
    <div class="page-main-options">
      <div style="flex: 1; flex-basis: 200px">
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

      <div style="flex: 1; flex-basis: 200px">
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

      <div style="flex: 1; flex-basis: 250px">
        <div>Chọn trạng thái</div>
        <div>
          <VueSelect
            v-model:value="stockCheckStatus"
            :options="stockCheckStatusOptions"
            @update:value="startSearch"
          />
        </div>
      </div>
    </div>

    <div class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th class="cursor-pointer whitespace-nowrap" @click="changeSort('id')">
              <div class="flex items-center gap-1 justify-center">
                <span>Mã</span>
                <IconSort v-if="sortColumn !== 'id'" style="opacity: 0.4" />
                <IconSortUp
                  v-if="sortColumn === 'id' && sortValue === 'ASC'"
                  style="opacity: 0.4"
                />
                <IconSortDown
                  v-if="sortColumn === 'id' && sortValue === 'DESC'"
                  style="opacity: 0.4"
                />
              </div>
            </th>
            <th>Thời gian</th>
            <th>Trạng thái</th>
            <th>NV tạo phiếu</th>
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
          <tr v-if="stockCheckList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(stockCheck, index) in stockCheckList" :key="index">
            <td class="text-center" style="white-space: nowrap">
              <router-link :to="{ name: 'StockCheckDetail', params: { id: stockCheck.id } }">
                SC{{ stockCheck.id }}
                <span class="text-lg ml-1">
                  <IconVisibility />
                </span>
              </router-link>
            </td>
            <td style="white-space: nowrap" class="text-center">
              {{ timeToText(stockCheck.createdAt, 'hh:mm DD/MM/YYYY') }}
            </td>
            <td class="text-center">
              <StockCheckStatusTag :stockCheck="stockCheck" />
            </td>
            <td>
              <div>
                {{ stockCheck.createdByUser?.fullName }}
              </div>
            </td>
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
          { value: 10, label: '10' },
          { value: 20, label: '20' },
          { value: 50, label: '50' },
          { value: 100, label: '100' },
        ]"
      />
    </div>
  </div>
</template>
