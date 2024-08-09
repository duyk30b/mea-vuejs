<script setup lang="ts">
import { ScheduleOutlined } from '@ant-design/icons-vue'
import type { Dayjs } from 'dayjs'
import { onBeforeMount, onMounted, ref } from 'vue'
import VueButton from '../../common/VueButton.vue'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { VueSelect } from '../../common/vue-form'
import InputOptions from '../../common/vue-form/InputOptions.vue'
import { useMeStore } from '../../modules/_me/me.store'
import { Appointment, AppointmentApi, AppointmentStatus } from '../../modules/appointment'
import { useCustomerStore, type Customer } from '../../modules/customer'
import { PermissionId } from '../../modules/permission/permission.enum'
import { DTimer } from '../../utils'
import ModalAppointmentRegister from './ModalAppointmentRegister.vue'
import ModalCustomerDetail from '../customer/detail/ModalCustomerDetail.vue'
import { IconFileSearch } from '../../common/icon'
import AppointmentStatusTag from './AppointmentStatusTag.vue'
import { IconEditSquare } from '../../common/icon-google'

const modalAppointmentRegister = ref<InstanceType<typeof ModalAppointmentRegister>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()

const customerStore = useCustomerStore()
const meStore = useMeStore()
const { permissionIdMap } = meStore

const appointmentList = ref<Appointment[]>([])

const customerList = ref<Customer[]>([])
const customerId = ref<number>()

const timeRanger = ref<[Dayjs | null, Dayjs | null]>([null, null])
const appointmentStatusList = ref<AppointmentStatus[]>([
  AppointmentStatus.Waiting,
  AppointmentStatus.Confirm,
])

const page = ref(1)
const limit = ref(Number(localStorage.getItem('APPOINTMENT_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const dataLoading = ref(false)

const startFetchData = async () => {
  try {
    dataLoading.value = true

    const fromTime = timeRanger.value?.[0]?.startOf('day').toDate()
    const toTime = timeRanger.value?.[1]?.endOf('day').toDate()

    const response = await AppointmentApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: { customer: true },
      filter: {
        registeredAt:
          fromTime && toTime
            ? {
                GTE: fromTime ? fromTime : undefined,
                LTE: toTime ? toTime : undefined,
              }
            : undefined,
        customerId: customerId.value ? customerId.value : undefined,
        appointmentStatus: appointmentStatusList.value.length
          ? { IN: appointmentStatusList.value }
          : undefined,
      },
      sort: { registeredAt: 'ASC' },
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

const handleModalAppointmentRegisterSuccess = async () => {
  // reload bằng lắng nghe event socket
  await startFetchData()
}
</script>

<template>
  <ModalAppointmentRegister
    ref="modalAppointmentRegister"
    @success="handleModalAppointmentRegisterSuccess" />
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <div class="page-header">
    <div class="flex items-center gap-4">
      <div
        class="hidden md:block"
        style="font-size: 1.25rem; font-weight: 500; line-height: 1.75rem">
        <ScheduleOutlined class="mr-1" />
        Danh sách hẹn khám
      </div>
      <div>
        <VueButton
          v-if="permissionIdMap[PermissionId.APPOINTMENT_CREATE]"
          icon="plus"
          color="blue"
          @click="modalAppointmentRegister?.openModal()">
          Tạo lịch hẹn mới
        </VueButton>
      </div>
    </div>
    <div class="page-header-setting"></div>
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
            v-model:value="appointmentStatusList"
            :options="[
              { value: [], text: 'Tất cả' },
              { value: [AppointmentStatus.Waiting], text: 'Chờ xác nhận' },
              { value: [AppointmentStatus.Confirm], text: 'Đã xác nhận' },
              { value: [AppointmentStatus.Completed], text: 'Hoàn thành (KH đã đến khám)' },
              { value: [AppointmentStatus.Cancelled], text: 'Hủy hẹn' },
            ]"
            @update:value="handleSelectAppointmentStatus" />
        </div>
      </div>
    </div>

    <div class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Trạng thái</th>
            <th>Thời gian</th>
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
        <tbody v-if="!dataLoading">
          <tr v-if="appointmentList.length === 0">
            <td colspan="20" class="text-center">Không có lịch khám nào</td>
          </tr>
          <tr v-for="(appointment, index) in appointmentList" :key="index">
            <td style="width: 100px">
              <div class="flex justify-between">
                <div>HK{{ appointment.id }}</div>
                <div v-if="permissionIdMap[PermissionId.APPOINTMENT_UPDATE]">
                  <a
                    style="color: #eca52b"
                    class="text-xl"
                    @click="modalAppointmentRegister?.openModal(appointment)">
                    <IconEditSquare />
                  </a>
                </div>
              </div>
            </td>
            <td style="width: 200px">
              <div class="flex justify-center">
                <div>
                  <AppointmentStatusTag :appointmentStatus="appointment.appointmentStatus" />
                </div>
              </div>
            </td>
            <td class="text-center" style="width: 200px">
              {{ DTimer.timeToText(appointment.registeredAt, 'DD/MM/YYYY hh:mm') }}
            </td>
            <td>
              <div>
                {{ appointment.customer?.fullName }}
                <a class="ml-1" @click="modalCustomerDetail?.openModal(appointment.customer!)">
                  <IconFileSearch />
                </a>
              </div>
              <div v-if="appointment.customer?.note" class="text-xs italic">
                {{ appointment.customer?.note }}
              </div>
            </td>
            <td>{{ appointment.reason }}</td>
            <td class="text-center">
              <div v-if="permissionIdMap[PermissionId.APPOINTMENT_UPDATE]">
                <a
                  style="color: #eca52b"
                  class="text-xl"
                  @click="modalAppointmentRegister?.openModal(appointment)">
                  <IconEditSquare />
                </a>
              </div>
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
