<script setup lang="ts">
import { FileSearchOutlined, ReadOutlined, ScheduleOutlined } from '@ant-design/icons-vue'
import dayjs, { type Dayjs } from 'dayjs'
import { onBeforeMount, onMounted, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconTrash } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputOptions, VueSelect } from '../../../common/vue-form'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { useCustomerStore, type Customer } from '../../../modules/customer'
import { VoucherType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { TicketApi, TicketStatus } from '../../../modules/ticket'
import { TicketClinicApi } from '../../../modules/ticket-clinic'
import { useTicketClinicStore } from '../../../modules/ticket-clinic/ticket-clinic.store'
import { DTimer } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import TicketClinicStatusTag from '../TicketClinicStatusTag.vue'
import ModalTicketClinicRegister from './ModalTicketClinicRegister.vue'

const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalTicketClinicRegister = ref<InstanceType<typeof ModalTicketClinicRegister>>()

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
const ticketStatus = ref<TicketStatus | null>(null)

const sortColumn = ref<'registeredAt' | 'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const ticketClinicStore = useTicketClinicStore()

const startFetchData = async () => {
  try {
    dataLoading.value = true

    const fromTime = timeRanger.value?.[0].startOf('day').toDate()
    const toTime = timeRanger.value?.[1].endOf('day').toDate()

    const { data, meta } = await TicketApi.pagination({
      page: ticketClinicStore.paginationMeta.page,
      limit: ticketClinicStore.paginationMeta.limit,
      relation: { customer: true, ticketDiagnosis: true },
      filter: {
        customerId: customerId.value ? customerId.value : undefined,
        registeredAt:
          fromTime && toTime
            ? {
                GTE: fromTime ? fromTime : undefined,
                LTE: toTime ? toTime : undefined,
              }
            : undefined,
        ticketStatus: ticketStatus.value ?? undefined,
        voucherType: VoucherType.Clinic,
      },
      sort: sortValue.value
        ? {
            id: sortColumn.value === 'id' ? sortValue.value : undefined,
            registeredAt: sortColumn.value === 'registeredAt' ? sortValue.value : undefined,
          }
        : { registeredAt: 'DESC' },
    })

    ticketClinicStore.ticketList = data
    ticketClinicStore.paginationMeta.limit = meta.limit
    ticketClinicStore.paginationMeta.page = meta.page
    ticketClinicStore.paginationMeta.total = meta.total
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
  ticketClinicStore.paginationMeta.page = 1
  await startFetchData()
}

const handleSelectTicketStatus = async () => {
  await startSearch()
}

const handleChangeTime = async (value: any) => {
  await startSearch()
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
  if (options.page) ticketClinicStore.paginationMeta.page = options.page
  if (options.limit) {
    ticketClinicStore.paginationMeta.limit = options.limit
    localStorage.setItem('TICKET_CLINIC_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

const handleMenuSettingClick = (menu: { key: string }) => {}
const handleModalTicketClinicRegisterSuccess = async () => {
  // reload bằng lắng nghe event socket
  // await startFetchData()
}

const handleClickDestroyDraft = async (ticketId: number) => {
  ModalStore.confirm({
    title: 'Bạn có chắc muốn xóa lượt khám này ?',
    content: 'Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    onOk: async () => {
      try {
        await TicketClinicApi.destroyDraftSchedule(ticketId)
        await startFetchData()
        AlertStore.addSuccess('Xóa phiếu khám thành công')
      } catch (error) {
        console.log('🚀 ~ file: TicketClinicList.vue:171 ~ handleClickDestroyDraft ~ error:', error)
      }
    },
  })
}
</script>

<template>
  <ModalTicketClinicRegister
    ref="modalTicketClinicRegister"
    @success="handleModalTicketClinicRegisterSuccess" />
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
          v-if="permissionIdMap[PermissionId.TICKET_CLINIC_REGISTER_NEW]"
          color="blue"
          icon="plus"
          @click="modalTicketClinicRegister?.openModal()">
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
            v-model:value="ticketStatus"
            :options="[
              { value: null, text: 'Tất cả' },
              { value: TicketStatus.Schedule, text: 'Hẹn khám' },
              { value: TicketStatus.Draft, text: 'Chờ khám' },
              { value: TicketStatus.Approved, text: 'Tạm ứng' },
              { value: TicketStatus.Executing, text: 'Đang khám' },
              { value: TicketStatus.Debt, text: 'Nợ' },
              { value: TicketStatus.Completed, text: 'Hoàn thành' },
            ]"
            @update:value="handleSelectTicketStatus" />
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
            <th style="white-space: nowrap">Lý do / Chẩn đoán</th>
            <th>Thanh toán</th>
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
        <tbody v-else>
          <tr v-if="ticketClinicStore.ticketList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(ticket, index) in ticketClinicStore.ticketList" :key="index">
            <td class="text-center">
              <div class="flex gap-4 justify-center">
                <router-link
                  :to="{ name: 'TicketClinicDetailContainer', params: { id: ticket.id } }">
                  <div class="flex justify-center items-center gap-2">
                    <span>KB{{ ticket.id }}</span>
                    <span class="text-lg"><ReadOutlined /></span>
                  </div>
                </router-link>
              </div>
            </td>
            <td class="text-center">
              <div>
                <TicketClinicStatusTag :ticketStatus="ticket.ticketStatus" />
              </div>
            </td>
            <td class="text-center">
              {{ DTimer.timeToText(ticket.startedAt || ticket.registeredAt, 'hh:mm DD/MM/YYYY') }}
            </td>
            <td>
              <div>
                {{ ticket.customer?.fullName }}
                <a class="ml-1" @click="modalCustomerDetail?.openModal(ticket.customer!)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div v-if="ticket.customer?.note" class="text-xs italic">
                {{ ticket.customer?.note }}
              </div>
            </td>
            <td>
              {{ ticket.ticketDiagnosis?.diagnosis || ticket.ticketDiagnosis?.reason || '' }}
            </td>
            <td class="text-center">
              {{ formatMoney(ticket.paid) }} / {{ formatMoney(ticket.totalMoney) }}
            </td>
            <td class="text-center">
              <a
                v-if="[TicketStatus.Schedule, TicketStatus.Draft].includes(ticket.ticketStatus)"
                class="text-red-500"
                @click="handleClickDestroyDraft(ticket.id)">
                <IconTrash />
              </a>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="mt-4 float-right mb-4">
        <a-pagination
          v-model:current="ticketClinicStore.paginationMeta.page"
          v-model:pageSize="ticketClinicStore.paginationMeta.limit"
          :total="ticketClinicStore.paginationMeta.total"
          show-size-changer
          @change="
            (page: number, pageSize: number) => changePagination({ page, limit: pageSize })
          " />
      </div>
    </div>
  </div>
</template>
