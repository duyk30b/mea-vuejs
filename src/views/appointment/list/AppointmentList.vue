<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import { IconDelete, IconFileSearch, IconSchedule, IconSetting } from '../../../common/icon-antd'
import { IconEditSquare } from '../../../common/icon-google'
import { InputDate, InputOptions, InputSelect, VueSelect } from '../../../common/vue-form'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Appointment, AppointmentApi, AppointmentStatus } from '../../../modules/appointment'
import { CustomerService, type Customer } from '../../../modules/customer'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { ESTimer, formatPhone } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import AppointmentStatusTag from '../AppointmentStatusTag.vue'
import ModalAppointmentUpsert from '../upsert/ModalAppointmentUpsert.vue'
import ModalAppointmentListSetting from './ModalAppointmentListSetting.vue'
import ModalAppointmentRegisterTicketClinic from './ModalAppointmentRegisterTicketClinic.vue'
import VuePagination from '../../../common/VuePagination.vue'

const modalAppointmentUpsert = ref<InstanceType<typeof ModalAppointmentUpsert>>()
const modalAppointmentRegisterTicketClinic =
  ref<InstanceType<typeof ModalAppointmentRegisterTicketClinic>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalAppointmentListSetting = ref<InstanceType<typeof ModalAppointmentListSetting>>()

const router = useRouter()
const route = useRoute()

const meStore = useMeStore()
const settingStore = useSettingStore()
const { permissionIdMap } = meStore

const appointmentList = ref<Appointment[]>([])

const customerList = ref<Customer[]>([])
const customerId = ref<number>()

const appointmentStatusList = ref<AppointmentStatus[]>([])

const startTime = ESTimer.startOfDate(new Date()).getTime()
let toTime: number | null = 0
if (settingStore.APPOINTMENT_LIST.fromDateToDateDistance !== -1) {
  toTime =
    startTime + Number(settingStore.APPOINTMENT_LIST.fromDateToDateDistance) * 24 * 60 * 60 * 1000
} else {
  toTime = null
}
const fromDate = ref<number>(startTime)
const toDate = ref<number | null>(toTime)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('APPOINTMENT_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const dataLoading = ref(false)

const startFetchData = async () => {
  try {
    dataLoading.value = true

    const { data, meta } = await AppointmentApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: { customer: true },
      filter: {
        registeredAt:
          fromDate.value || toDate.value
            ? {
                GTE: fromDate.value ? fromDate.value : undefined,
                LT: toDate.value ? toDate.value + 24 * 60 * 60 * 1000 : undefined,
              }
            : undefined,
        customerId: customerId.value ? customerId.value : undefined,
        appointmentStatus: appointmentStatusList.value.length
          ? { IN: appointmentStatusList.value }
          : undefined,
      },
      sort: { registeredAt: 'ASC' },
    })

    appointmentList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: VisitList.vue:72 ~ startFetchData ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

onBeforeMount(async () => {
  await startFetchData()
})

const searchingCustomer = async (text: string) => {
  if (text) {
    customerList.value = await CustomerService.search(text)
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

const handleClickDeleteAppointment = async (appointmentId: number) => {
  ModalStore.confirm({
    title: 'Bạn có chắc muốn xóa lịch hẹn này ?',
    content: 'Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    onOk: async () => {
      try {
        await AppointmentApi.delete(appointmentId)
        await startFetchData()
      } catch (error) {
        console.log('🚀 ~ file: AppointmentList.vue:168 ~ onOk: ~ error:', error)
      }
    },
  })
}

const openBlankTicketClinicDetail = async (ticketId: number) => {
  const route = router.resolve({
    name: 'TicketClinicDetailContainer',
    params: { id: ticketId },
  })
  window.open(route.href, '_blank')
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'SETTING_SCREEN') {
    modalAppointmentListSetting.value?.openModal()
  }
}

const handleFocusFirstSearchCustomer = async () => {
  await CustomerService.refreshDB()
}
</script>

<template>
  <ModalAppointmentUpsert ref="modalAppointmentUpsert" @success="startFetchData" />
  <ModalAppointmentRegisterTicketClinic
    ref="modalAppointmentRegisterTicketClinic"
    @success="startFetchData"
  />
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <ModalAppointmentListSetting
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalAppointmentListSetting"
  />
  <div class="page-header">
    <div class="flex items-center gap-4">
      <div class="hidden md:flex items-center gap-2 font-medium text-xl">
        <IconSchedule />
        Danh sách hẹn khám
      </div>
      <div>
        <VueButton
          v-if="permissionIdMap[PermissionId.APPOINTMENT_CREATE]"
          icon="plus"
          color="blue"
          @click="modalAppointmentUpsert?.openModalForCreate()"
        >
          Tạo lịch hẹn mới
        </VueButton>
      </div>
    </div>
    <div class="flex mr-2 gap-8">
      <span style="cursor: pointer">
        <a-dropdown
          v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
          trigger="click"
        >
          <span>
            <IconSetting width="20" height="20" />
          </span>
          <template #overlay>
            <a-menu @click="handleMenuSettingClick">
              <a-menu-item key="SETTING_SCREEN">Cài đặt hiển thị</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </span>
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
            @onFocusinFirst="handleFocusFirstSearchCustomer"
            @update:text="searchingCustomer"
          >
            <template #option="{ item: { data } }">
              <div>
                <b>{{ data.fullName }}</b>
                - {{ data.phone }} -
                {{ ESTimer.timeToText(data.birthday, 'DD/MM/YYYY') }}
              </div>
              <div>
                {{ data.addressWard }} - {{ data.addressDistrict }} - {{ data.addressProvince }}
              </div>
            </template>
          </InputOptions>
        </div>
      </div>

      <div style="flex: 1; flex-basis: 250px">
        <div>Từ ngày</div>
        <div>
          <InputDate
            v-model:value="fromDate"
            type-parser="number"
            class="w-full"
            @selectTime="handleChangeTime"
          />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 250px">
        <div>Đến ngày</div>
        <div>
          <InputDate
            v-model:value="toDate"
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
            v-model:value="appointmentStatusList"
            :options="[
              { value: [], text: 'Tất cả' },
              {
                value: [AppointmentStatus.Waiting, AppointmentStatus.Confirm],
                text: 'Chờ xác nhận + Đã xác nhận',
              },
              { value: [AppointmentStatus.Waiting], text: 'Chờ xác nhận' },
              { value: [AppointmentStatus.Confirm], text: 'Đã xác nhận' },
              { value: [AppointmentStatus.Completed], text: 'Đã đến khám' },
              { value: [AppointmentStatus.Cancelled], text: 'Hủy hẹn' },
            ]"
            @update:value="handleSelectAppointmentStatus"
          />
        </div>
      </div>

      <div>
        <div>&nbsp;</div>
        <div>
          <VueButton color="blue" @click="startSearch">Tìm kiếm</VueButton>
        </div>
      </div>
    </div>

    <div class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Trạng thái</th>
            <th>Phiếu khám</th>
            <th>Thời gian hẹn</th>
            <th>Khách hàng</th>
            <th>SĐT</th>
            <th>Ngày sinh</th>
            <th>Lý do</th>
            <th></th>
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
            <td colspan="20" class="text-center">Không có lịch hẹn nào</td>
          </tr>
          <tr v-for="(appointment, index) in appointmentList" :key="index">
            <td>
              <div class="flex justify-between items-center gap-4">
                <div>HK{{ appointment.id }}</div>
                <div v-if="permissionIdMap[PermissionId.APPOINTMENT_UPDATE]">
                  <a
                    style="color: #eca52b"
                    class="text-xl"
                    @click="modalAppointmentUpsert?.openModalForUpdate(appointment)"
                  >
                    <IconEditSquare />
                  </a>
                </div>
              </div>
            </td>
            <td style="text-align: center">
              <AppointmentStatusTag :appointmentStatus="appointment.appointmentStatus" />
            </td>
            <td class="text-center">
              <div
                v-if="
                  [AppointmentStatus.Waiting, AppointmentStatus.Confirm].includes(
                    appointment.appointmentStatus,
                  )
                "
                class="flex items-center justify-center"
              >
                <VueButton
                  size="small"
                  @click="modalAppointmentRegisterTicketClinic?.openModal(appointment)"
                >
                  Đăng ký khám
                </VueButton>
              </div>
              <div v-if="[AppointmentStatus.Completed].includes(appointment.appointmentStatus)">
                <a @click="openBlankTicketClinicDetail(appointment.toTicketId)">
                  KB{{ appointment.toTicketId }}
                </a>
              </div>
            </td>
            <td class="text-center">
              {{ ESTimer.timeToText(appointment.registeredAt, 'DD/MM/YYYY hh:mm') }}
            </td>
            <td>
              <div>
                {{ appointment.customer?.fullName }}
                <a class="ml-1" @click="modalCustomerDetail?.openModal(appointment.customerId)">
                  <IconFileSearch />
                </a>
              </div>
              <div v-if="appointment.customer?.note" class="text-xs italic">
                {{ appointment.customer?.note }}
              </div>
            </td>
            <td class="text-center" style="width: 200px; white-space: nowrap">
              <a
                v-if="appointment.customer?.phone"
                :href="'tel:' + appointment.customer?.phone || ''"
              >
                {{ formatPhone(appointment.customer?.phone || '') }}
              </a>
            </td>
            <td class="text-center">
              {{
                ESTimer.timeToText(appointment.customer?.birthday) ||
                appointment.customer?.yearOfBirth ||
                ''
              }}
            </td>
            <td>{{ appointment.reason }}</td>
            <td class="text-center">
              <a
                v-if="[AppointmentStatus.Cancelled].includes(appointment.appointmentStatus)"
                class="text-red-500"
                @click="handleClickDeleteAppointment(appointment.id)"
              >
                <IconDelete width="18" height="18" />
              </a>
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
