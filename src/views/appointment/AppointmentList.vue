<script setup lang="ts">
import {
  FileSearchOutlined,
  PlusOutlined,
  ReadOutlined,
  ScheduleOutlined,
} from '@ant-design/icons-vue'
import dayjs, { type Dayjs } from 'dayjs'
import { onBeforeMount, onMounted, ref } from 'vue'
import VueButton from '../../common/VueButton.vue'
import { PermissionId } from '../../modules/permission/permission.enum'
import { useMeStore } from '../../modules/_me/me.store'
import { DTimer } from '../../utils'
import InputOptions from '../../common/vue-form/InputOptions.vue'
import { useCustomerStore, type Customer } from '../../modules/customer'
import { Appointment, AppointmentApi, AppointmentStatus } from '../../modules/appointment'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { VueSelect } from '../../common/vue-form'

const customerStore = useCustomerStore()
const meStore = useMeStore()
const { permissionIdMap } = meStore

const appointmentList = ref<Appointment[]>([])

const customerList = ref<Customer[]>([])
const customerId = ref<number>()

const startDate = DTimer.startOfDate(new Date())
const endDate = DTimer.endOfDate(new Date())
const timeRanger = ref<[Dayjs, Dayjs]>([dayjs(startDate), dayjs(endDate)])
const appointmentStatus = ref<AppointmentStatus | null>(null)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('APPOINTMENT_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const dataLoading = ref(false)

const startFetchData = async () => {
  try {
    dataLoading.value = true

    const fromTime = timeRanger.value?.[0].startOf('day').toDate()
    const toTime = timeRanger.value?.[1].endOf('day').toDate()

    const response = await AppointmentApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: { customer: true },
      filter: {
        time:
          fromTime && toTime
            ? {
                GTE: fromTime ? fromTime : undefined,
                LTE: toTime ? toTime : undefined,
              }
            : undefined,
        customerId: customerId.value ? customerId.value : undefined,
        appointmentStatus: appointmentStatus.value ?? undefined,
      },
      sort: { time: 'DESC' },
    })

    appointmentList.value = response.data
    total.value = response.meta.total
  } catch (error) {
    console.log('🚀 ~ file: VisitList.vue:72 ~ startFetchData ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

onBeforeMount(async () => {
  try {
    dataLoading.value = true
    await startFetchData()
  } catch (error) {
    console.log('🚀 ~ onBeforeMount ~ error:', error)
  } finally {
    dataLoading.value = false
  }
})

onMounted(async () => {
  try {
    const { hasChange } = await customerStore.refreshDB() // reload nếu có dữ liệu mới nhất
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
  page.value = 1
  await startFetchData()
}

const handleSelectAppointmentStatus = async () => {
  await startSearch()
}

const handleChangeTime = async (value: any) => {
  await startSearch()
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('APPOINTMENT_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}
</script>

<template>
  <div class="page-header">
    <div class="flex items-center gap-4">
      <div
        class="hidden md:block"
        style="font-size: 1.25rem; font-weight: 500; line-height: 1.75rem">
        <ScheduleOutlined class="mr-1" />
        Danh sách hẹn khám
      </div>
      <div>
        <VueButton v-if="permissionIdMap[PermissionId.APPOINTMENT_CREATE]" icon="plus" color="blue">
          Tạo lịch hẹn mới
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
                {{ DTimer.timeToText(data.birthday, 'DD/MM/YYYY') }}
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
            v-model:value="appointmentStatus"
            :options="[
              { value: null, text: 'Tất cả' },
              { value: AppointmentStatus.Waiting, text: 'Nhắc khám lại' },
              { value: AppointmentStatus.Confirm, text: 'KH xác nhận lịch' },
              { value: AppointmentStatus.Completed, text: 'Hoàn thành (KH đã đến khám)' },
              { value: AppointmentStatus.Cancelled, text: 'Hủy lịch' },
            ]"
            @update:value="handleSelectAppointmentStatus" />
        </div>
      </div>
    </div>

    <div class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Khách hàng</th>
            <th>Lý do</th>
            <th>#</th>
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
      </table>
      <div class="mt-4 float-right mb-4">
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
