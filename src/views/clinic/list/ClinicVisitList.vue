<script setup lang="ts">
import {
  FileSearchOutlined,
  PlusOutlined,
  ReadOutlined,
  ScheduleOutlined,
} from '@ant-design/icons-vue'
import dayjs, { type Dayjs } from 'dayjs'
import { onBeforeMount, onMounted, ref } from 'vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputOptions, VueSelect } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { useVisitStore } from '../../../modules/visit/visit.store'
import { useCustomerStore, type Customer } from '../../../modules/customer'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { VisitApi, VisitStatus } from '../../../modules/visit'
import { DTimer, timeToText } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import VisitStatusTag from '../ClinicStatusTag.vue'
import ModalClinicVisitCreate from './ModalClinicVisitCreate.vue'
import VueButton from '../../../common/VueButton.vue'

const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalClinicVisitCreate = ref<InstanceType<typeof ModalClinicVisitCreate>>()

const customerStore = useCustomerStore()
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const customerList = ref<Customer[]>([])

const dataLoading = ref(false)

const startDate = DTimer.startOfDate(new Date())
const endDate = DTimer.endOfDate(new Date())

const timeRanger = ref<[Dayjs, Dayjs]>([dayjs(startDate), dayjs(endDate)])
const customerId = ref<number>()

const sortColumn = ref<'registeredAt' | 'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const visitStore = useVisitStore()

const visitStatus = ref(null)

const startFetchData = async () => {
  try {
    dataLoading.value = true

    const fromTime = timeRanger.value?.[0].startOf('day').toDate()
    const toTime = timeRanger.value?.[1].endOf('day').toDate()

    const { data, meta } = await VisitApi.pagination({
      page: visitStore.paginationMeta.page,
      limit: visitStore.paginationMeta.limit,
      relation: { customer: true, visitDiagnosis: true },
      filter: {
        customerId: customerId.value ? customerId.value : undefined,
        registeredAt:
          fromTime && toTime
            ? {
                GTE: fromTime ? fromTime : undefined,
                LTE: toTime ? toTime : undefined,
              }
            : undefined,
      },
      sort: sortValue.value
        ? {
            id: sortColumn.value === 'id' ? sortValue.value : undefined,
            registeredAt: sortColumn.value === 'registeredAt' ? sortValue.value : undefined,
          }
        : { registeredAt: 'DESC' },
    })

    visitStore.visitList = data
    visitStore.paginationMeta.limit = meta.limit
    visitStore.paginationMeta.page = meta.page
    visitStore.paginationMeta.total = meta.total
  } catch (error) {
    console.log('🚀 ~ file: VisitList.vue:72 ~ startFetchData ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

onBeforeMount(async () => {
  await startFetchData()
})

onMounted(async () => {
  try {
    await customerStore.refreshDB()
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const searchingCustomer = async (text: string) => {
  if (text) {
    customerList.value = await customerStore.search(text)
  } else {
    customerList.value = []
    if (customerId.value) {
      customerId.value = undefined
      await startFetchData()
    }
  }
}

const selectCustomer = async (data?: Customer) => {
  customerId.value = data?.id
  await startFetchData()
}

const startSearch = async () => {
  visitStore.paginationMeta.page = 1
  await startFetchData()
}

const handleSelectCheckupStatus = async () => {
  await startSearch()
}

const handleChangeTime = async (value: any) => {
  await startFetchData()
}

const changeSort = async (column: 'id' | 'registeredAt') => {
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
  if (options.page) visitStore.paginationMeta.page = options.page
  if (options.limit) {
    visitStore.paginationMeta.limit = options.limit
    localStorage.setItem('INVOICE_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

const handleMenuSettingClick = (menu: { key: string }) => {}
const handleModalClinicVisitCreateSuccess = async () => {
  // reload bằng lắng nghe event socket
  // await startFetchData()
}
</script>

<template>
  <ModalClinicVisitCreate
    ref="modalClinicVisitCreate"
    @success="handleModalClinicVisitCreateSuccess" />
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <div class="page-header">
    <div class="flex items-center gap-4">
      <div
        class="hidden md:block"
        style="font-size: 1.25rem; font-weight: 500; line-height: 1.75rem">
        <ScheduleOutlined class="mr-1" />
        Danh sách khám
      </div>
      <div>
        <VueButton
          v-if="permissionIdMap[PermissionId.VISIT_CREATE]"
          color="blue"
          @click="modalClinicVisitCreate?.openModal()">
          <PlusOutlined />
          KHÁM MỚI
        </VueButton>
      </div>
    </div>
    <div class="page-header-setting">
      <!-- <a-dropdown trigger="click">
        <span style="font-size: 1.2rem; cursor: pointer;">
          <SettingOutlined />
        </span>
        <template #overlay>
          <a-menu @click="handleMenuSettingClick">
            <a-menu-item key="screen-setting"> Cài đặt hiển thị </a-menu-item>
          </a-menu>~~
        </template>
      </a-dropdown> -->
    </div>
  </div>

  <div class="page-main">
    <div class="page-main-options">
      <div style="flex: 1; flex-basis: 250px">
        <div>Khách hàng</div>
        <div>
          <InputOptions
            ref="inputSearchCustomer"
            :options="customerList.map((i) => ({ value: i.id, text: i.fullName, data: i }))"
            :maxHeight="260"
            placeholder="Tên hoặc Số Điện Thoại"
            @selectItem="({ data }) => selectCustomer(data)"
            @update:text="searchingCustomer">
            <template #option="{ item: { data } }">
              <div>
                <b>{{ data.fullName }}</b>
                - {{ data.phone }} -
                {{ timeToText(data.birthday, 'DD/MM/YYYY') }}
              </div>
              <div>
                {{ data.addressWard }} - {{ data.addressDistrict }} - {{ data.addressProvince }}
              </div>
            </template>
          </InputOptions>
        </div>
      </div>

      <div style="flex: 1; flex-basis: 250px">
        <div>Chọn thời gian</div>
        <div>
          <a-range-picker
            v-model:value="timeRanger"
            :onChange="handleChangeTime"
            format="DD-MM-YYYY"
            style="width: 100%"
            :placeholder="['DD-MM-YYYY', 'DD-MM-YYYY']" />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 250px">
        <div>Chọn trạng thái</div>
        <div>
          <VueSelect
            v-model:value="visitStatus"
            :options="[
              { value: null, text: 'Tất cả' },
              { value: VisitStatus.Waiting, text: 'Đợi khám' },
              { value: VisitStatus.InProgress, text: 'Đang khám' },
              { value: VisitStatus.Debt, text: 'Nợ' },
              { value: VisitStatus.Completed, text: 'Hoàn thành' },
            ]"
            @update:value="handleSelectCheckupStatus"></VueSelect>
        </div>
      </div>
    </div>

    <div class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th class="cursor-pointer" @click="changeSort('id')">
              Hồ Sơ &nbsp;
              <font-awesome-icon
                v-if="sortColumn !== 'id'"
                :icon="['fas', 'sort']"
                style="opacity: 0.4" />
              <font-awesome-icon
                v-if="sortColumn === 'id' && sortValue === 'ASC'"
                :icon="['fas', 'sort-up']" />
              <font-awesome-icon
                v-if="sortColumn === 'id' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']" />
            </th>
            <th class="">T.T</th>
            <th class="cursor-pointer" @click="changeSort('registeredAt')">
              Thời gian &nbsp;
              <font-awesome-icon
                v-if="sortColumn !== 'id'"
                :icon="['fas', 'sort']"
                style="opacity: 0.4" />
              <font-awesome-icon
                v-if="sortColumn === 'id' && sortValue === 'ASC'"
                :icon="['fas', 'sort-up']" />
              <font-awesome-icon
                v-if="sortColumn === 'id' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']" />
            </th>
            <th style="min-width: 150px">Khách hàng</th>
            <th>Chẩn đoán</th>
            <th>Thanh toán</th>
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
          <tr v-if="visitStore.visitList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(visit, index) in visitStore.visitList" :key="index">
            <td class="text-center">
              <div class="flex gap-4 justify-center">
                <router-link :to="{ name: 'ClinicDetailContainer', params: { id: visit.id } }">
                  <div class="flex justify-center items-center gap-2">
                    <span>VS{{ visit.id }}</span>
                    <span class="text-lg"><ReadOutlined /></span>
                  </div>
                </router-link>
              </div>
            </td>
            <td class="text-center">
              <div>
                <VisitStatusTag :visitStatus="visit.visitStatus" />
              </div>
            </td>
            <td class="text-center">
              {{ timeToText(visit.startedAt || visit.registeredAt, 'hh:mm DD/MM/YYYY') }}
            </td>
            <td>
              <div>
                {{ visit.customer?.fullName }}
                <a class="ml-1" @click="modalCustomerDetail?.openModal(visit.customerId)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div v-if="visit.customer?.note" class="text-xs italic">
                {{ visit.customer?.note }}
              </div>
            </td>
            <td>
              {{ visit.visitDiagnosis?.diagnosis || visit.visitDiagnosis?.reason || '' }}
            </td>
            <td class="text-center">
              {{ formatMoney(visit.paid) }} / {{ formatMoney(visit.totalMoney) }}
            </td>
          </tr>
        </tbody>
      </table>
      <div class="mt-4 float-right mb-4">
        <a-pagination
          v-model:current="visitStore.paginationMeta.page"
          v-model:pageSize="visitStore.paginationMeta.limit"
          :total="visitStore.paginationMeta.total"
          show-size-changer
          @change="
            (page: number, pageSize: number) => changePagination({ page, limit: pageSize })
          " />
      </div>
    </div>
  </div>
</template>
