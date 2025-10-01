<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import VuePagination from '@/common/VuePagination.vue'
import { IconDelete, IconFileSearch, IconSchedule, IconSetting } from '@/common/icon-antd'
import { IconEditSquare } from '@/common/icon-google'
import VueDropdown from '@/common/popover/VueDropdown.vue'
import { InputDate, InputOptions, InputSelect, VueSelect } from '@/common/vue-form'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Appointment, AppointmentApi, AppointmentStatus } from '@/modules/appointment'
import { CustomerService, type Customer } from '@/modules/customer'
import { PermissionId } from '@/modules/permission/permission.enum'
import { ESString, ESTimer } from '@/utils'
import ModalCustomerDetail from '@/views/customer/detail/ModalCustomerDetail.vue'
import ModalProcedureDetail from '@/views/master-data/procedure/detail/ModalProcedureDetail.vue'
import { onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TicketLink from '../../room-ticket-base/TicketLink.vue'
import ModalProcessTicketProcedureRegimen from '../../room-ticket-clinic/detail/procedure/ModalProcessTicketProcedure.vue'
import ModalShowTicketProcedureRegimen from '../../room-ticket-clinic/detail/procedure/ModalShowTicketRegimen.vue'
import AppointmentStatusTag from '../AppointmentStatusTag.vue'
import ModalAppointmentUpsert from '../upsert/ModalAppointmentUpsert.vue'
import ModalAppointmentListSetting from './ModalAppointmentListSetting.vue'
import ModalAppointmentRegisterTicketClinic from './ModalAppointmentRegisterTicketClinic.vue'

const modalAppointmentUpsert = ref<InstanceType<typeof ModalAppointmentUpsert>>()
const modalAppointmentRegisterTicketClinic =
  ref<InstanceType<typeof ModalAppointmentRegisterTicketClinic>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalAppointmentListSetting = ref<InstanceType<typeof ModalAppointmentListSetting>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()
const modalShowTicketProcedureRegimen = ref<InstanceType<typeof ModalShowTicketProcedureRegimen>>()
const modalProcessTicketProcedureRegimen =
  ref<InstanceType<typeof ModalProcessTicketProcedureRegimen>>()

const router = useRouter()
const route = useRoute()

const settingStore = useSettingStore()
const { userPermission } = MeService

const appointmentList = ref<Appointment[]>([])

const customerList = ref<Customer[]>([])
const customerId = ref<number>()

const statusList = ref<AppointmentStatus[]>([])

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

    const paginationResponse = await AppointmentApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: {
        toTicket: true,
        customer: true,
      },
      filter: {
        registeredAt:
          fromDate.value || toDate.value
            ? {
                GTE: fromDate.value ? new Date(fromDate.value).toISOString() : undefined,
                LT: toDate.value
                  ? new Date(toDate.value + 24 * 60 * 60 * 1000).toISOString()
                  : undefined,
              }
            : undefined,
        customerId: customerId.value ? customerId.value : undefined,
        status: statusList.value.length ? { IN: statusList.value } : undefined,
      },
      sort: { registeredAt: 'ASC' },
    })

    appointmentList.value = paginationResponse.appointmentList

    total.value = paginationResponse.total
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

const handleClickDeleteAppointment = async (appointmentId: string) => {
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

const handleFocusFirstSearchCustomer = async () => {
  await CustomerService.refreshDB()
}
</script>

<template>
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <ModalAppointmentUpsert ref="modalAppointmentUpsert" @success="startFetchData" />
  <ModalAppointmentRegisterTicketClinic
    ref="modalAppointmentRegisterTicketClinic"
    @success="startFetchData"
  />
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <ModalAppointmentListSetting
    v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
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
          v-if="userPermission[PermissionId.APPOINTMENT_CREATE]"
          icon="plus"
          color="blue"
          @click="modalAppointmentUpsert?.openModalForCreate()"
        >
          Tạo lịch hẹn mới
        </VueButton>
      </div>
    </div>
    <div class="mr-2 flex gap-8">
      <VueDropdown v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]">
        <template #trigger>
          <span style="font-size: 1.2rem; cursor: pointer">
            <IconSetting />
          </span>
        </template>
        <div class="vue-menu">
          <a @click="modalAppointmentListSetting?.openModal()">Cài đặt hiển thị</a>
        </div>
      </VueDropdown>
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
                {{ data.addressStreet }} - {{ data.addressWard }} - {{ data.addressProvince }}
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
            v-model:value="statusList"
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
    </div>

    <div class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'">ID</th>
            <th>#</th>
            <th>Trạng thái</th>
            <th>Khách hàng</th>
            <th>Liên hệ</th>
            <th>Phiếu khám</th>
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
            <td v-if="CONFIG.MODE === 'development'" style="text-align: center; color: violet">
              {{ appointment.id }}
            </td>
            <td>
              <div class="flex justify-between items-center gap-4">
                <div>HK{{ appointment.id.slice(0, 8) }}</div>
                <div v-if="userPermission[PermissionId.APPOINTMENT_UPDATE]">
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
            <td>
              <div>
                <AppointmentStatusTag :status="appointment.status" />
              </div>
              <div class="text-xs italic whitespace-nowrap">
                {{ ESTimer.timeToText(appointment.registeredAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </td>
            <td>
              <div>
                {{ appointment.customer?.fullName }}
                <a class="ml-1" @click="modalCustomerDetail?.openModal(appointment.customerId)">
                  <IconFileSearch />
                </a>
              </div>
              <div class="text-xs italic">
                {{
                  ESTimer.timeToText(appointment.customer?.birthday, 'DD/MM/YYYY') ||
                  appointment.customer?.yearOfBirth ||
                  ''
                }}
                - {{ appointment.customer?.getAge ? appointment.customer?.getAge + ' Tuổi' : '' }}
              </div>
              <div v-if="appointment.customer?.note" class="text-xs italic">
                {{ appointment.customer?.note }}
              </div>
            </td>
            <td>
              <div v-if="appointment.customer?.phone">
                <a :href="'tel:' + appointment.customer?.phone || ''">
                  {{ ESString.formatPhone(appointment.customer?.phone || '') }}
                </a>
              </div>
              <div class="text-xs italic">
                {{ ESString.formatAddress(appointment.customer!) }}
              </div>
            </td>
            <td class="text-center">
              <div
                v-if="
                  [AppointmentStatus.Waiting, AppointmentStatus.Confirm].includes(
                    appointment.status,
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
              <div v-if="[AppointmentStatus.Completed].includes(appointment.status)">
                <div v-if="appointment.toTicket">
                  <TicketLink :ticket="appointment.toTicket" :ticketId="appointment.toTicketId" />
                </div>
              </div>
            </td>
            <td>
              <div>{{ appointment.reason }}</div>
              <div v-if="[AppointmentStatus.Cancelled].includes(appointment.status)">
                {{ appointment.cancelReason }}
              </div>
            </td>
            <td class="text-center">
              <a
                v-if="
                  userPermission[PermissionId.APPOINTMENT_DELETE] &&
                  [(AppointmentStatus.Waiting, AppointmentStatus.Cancelled)].includes(
                    appointment.status,
                  )
                "
                style="color: var(--text-red)"
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
