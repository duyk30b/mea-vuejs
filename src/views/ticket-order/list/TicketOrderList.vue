<script setup lang="ts">
import { FileSearchOutlined, ScheduleOutlined } from '@ant-design/icons-vue'
import type { Dayjs } from 'dayjs'
import { onBeforeMount, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconSetting } from '../../../common/icon'
import { IconVisibility } from '../../../common/icon-google'
import { InputOptions, VueSelect } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Customer, CustomerService } from '../../../modules/customer'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Ticket, TicketStatus, TicketType } from '../../../modules/ticket'
import { TicketApi } from '../../../modules/ticket/ticket.api'
import { DString, DTimer } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import TicketOrderStatusTag from '../TicketOrderStatusTag.vue'
import { ETicketOrderUpsertMode } from '../upsert/ticket-order-upsert.ref'
import ModalTicketOrderListSetting from './ModalTicketOrderListSetting.vue'

const modalTicketOrderListSetting = ref<InstanceType<typeof ModalTicketOrderListSetting>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const ticketList = ref<Ticket[]>([])
const customerList = ref<Customer[]>([])

const dataLoading = ref(false)
const page = ref(1)
const limit = ref(Number(localStorage.getItem('TICKET_ORDER_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const timeRanger = ref<[Dayjs, Dayjs]>()
const ticketStatus = ref<TicketStatus | null>(null)
const customerId = ref<number>()

const sortColumn = ref<'full_name_en' | 'debt' | 'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const startFetchData = async () => {
  try {
    dataLoading.value = true

    const fromTime = timeRanger.value?.[0].startOf('day').toDate()
    const toTime = timeRanger.value?.[1].endOf('day').toDate()

    const { data, meta } = await TicketApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: {
        customer: true,
        ticketAttributeList: settingStore.SCREEN_TICKET_ORDER_LIST.ticketAttributeList
          ? true
          : false,
        ticketProductList: settingStore.SCREEN_TICKET_ORDER_LIST.ticketProductList
          ? { product: true, batch: false }
          : false,
      },
      filter: {
        customerId: customerId.value ? customerId.value : undefined,
        startedAt: {
          GTE: fromTime ? fromTime : undefined,
          LTE: toTime ? toTime : undefined,
        },
        ticketStatus: ticketStatus.value ? ticketStatus.value : undefined,
        ticketType: TicketType.Order,
      },
      sort: sortValue.value
        ? {
            id: sortColumn.value === 'id' ? sortValue.value : undefined,
          }
        : { id: 'DESC' },
    })

    ticketList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: InvoiceList.vue:50 ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

onBeforeMount(async () => {
  await startFetchData()
})

const handleFocusFirstSearchCustomer = async () => {
  await CustomerService.refreshDB()
}

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
    localStorage.setItem('TICKET_ORDER_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalTicketOrderListSetting.value?.openModal()
  }
}
</script>

<template>
  <ModalTicketOrderListSetting
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalTicketOrderListSetting" />
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block">
        <ScheduleOutlined class="mr-1" />
        Danh sách hóa đơn
      </div>
      <div>
        <VueButton
          color="blue"
          icon="plus"
          @click="
            $router.push({
              name: 'TicketOrderUpsert',
              query: { mode: ETicketOrderUpsertMode.CREATE },
            })
          ">
          Tạo hóa đơn mới
        </VueButton>
      </div>
    </div>
    <div class="page-header-setting">
      <a-dropdown trigger="click">
        <span style="font-size: 1.2rem; cursor: pointer">
          <IconSetting />
        </span>
        <template #overlay>
          <a-menu @click="handleMenuSettingClick">
            <a-menu-item key="screen-setting">Cài đặt hiển thị</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>

  <div class="page-main">
    <div class="page-main-options">
      <div style="flex: 1; flex-basis: 250px">
        <div>Tên khách hàng</div>
        <div>
          <InputOptions
            ref="inputOptionsCustomer"
            :options="customerList.map((i) => ({ value: i.id, text: i.fullName, data: i }))"
            :maxHeight="260"
            placeholder="Tìm kiếm bằng Tên hoặc Số Điện Thoại"
            @selectItem="({ data }) => selectCustomer(data)"
            @onFocusinFirst="handleFocusFirstSearchCustomer"
            @update:text="searchingCustomer">
            <template #option="{ item: { data } }">
              <div>
                <b>{{ data.fullName }}</b>
                - {{ DString.formatPhone(data.phone) }} -
                {{ DTimer.timeToText(data.birthday, 'DD/MM/YYYY') }}
              </div>
              <div>{{ DString.formatAddress(data) }}</div>
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
              { text: 'Tất cả', value: null },
              { text: 'Nháp', value: TicketStatus.Draft },
              { text: 'Tạm ứng', value: TicketStatus.Approved },
              { text: 'Đang thực hiện', value: TicketStatus.Executing },
              { text: 'Nợ', value: TicketStatus.Debt },
              { text: 'Hoàn thành', value: TicketStatus.Completed },
              { text: 'Hủy', value: TicketStatus.Cancelled },
            ]"
            @update:value="() => startSearch()"></VueSelect>
        </div>
      </div>
    </div>

    <div v-if="isMobile" class="page-main-list table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Khách hàng</th>
            <th>Tiền Đơn</th>
            <th>Trạng thái</th>
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
          <tr v-if="ticketList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr
            v-for="(ticket, index) in ticketList"
            :key="index"
            @dblclick="$router.push({ name: 'TicketOrderDetail', params: { id: ticket.id } })">
            <td>
              <div class="font-medium text-justify">
                {{ ticket.customer?.fullName }}
                <a class="text-base" @click="modalCustomerDetail?.openModal(ticket.customerId)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div class="text-xs">
                {{ DTimer.timeToText(ticket.registeredAt, 'hh:mm DD/MM/YYYY') }}
              </div>
              <div v-if="ticket.customer?.note" class="text-xs italic">
                {{ ticket.customer?.note }}
              </div>
              <div
                v-if="
                  settingStore.SCREEN_TICKET_ORDER_LIST.ticketAttributeList &&
                  ticket?.ticketAttributeMap?.note
                "
                class="text-xs italic">
                {{ ticket?.ticketAttributeMap?.note }}
              </div>
            </td>
            <td class="text-right">
              <div>{{ formatMoney(ticket.totalMoney) }}</div>
              <div v-if="ticket.ticketStatus === TicketStatus.Debt" class="text-xs">
                Nợ: {{ formatMoney(ticket.debt) }}
              </div>
              <div v-if="settingStore.SCREEN_TICKET_ORDER_LIST.profit" class="text-xs italic">
                Lãi: {{ formatMoney(ticket.profit) }}
              </div>
            </td>
            <td>
              <TicketOrderStatusTag :ticketStatus="ticket.ticketStatus" />
            </td>
          </tr>
        </tbody>
      </table>
      <div class="mt-4 float-right mb-2">
        <a-pagination
          v-model:current="page"
          v-model:pageSize="limit"
          size="small"
          :total="total"
          show-size-changer
          @change="
            (page: number, pageSize: number) => changePagination({ page, limit: pageSize })
          " />
      </div>
    </div>

    <div v-if="!isMobile" class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th class="cursor-pointer" @click="changeSort('id')">
              Mã &nbsp;
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
            <th>Thời gian</th>
            <th>Khách hàng</th>
            <th v-if="settingStore.SCREEN_TICKET_ORDER_LIST.ticketProductList">Sản phẩm</th>
            <th>Tổng Tiền</th>
            <th v-if="settingStore.SCREEN_TICKET_ORDER_LIST.profit">Lãi</th>
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
          <tr v-if="ticketList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(ticket, index) in ticketList" :key="index">
            <td class="text-center">
              <router-link :to="{ name: 'TicketOrderDetail', params: { id: ticket.id } }">
                BH{{ ticket.id }}
                <span class="text-lg ml-1">
                  <IconVisibility />
                </span>
              </router-link>
            </td>
            <td class="text-center">
              {{ DTimer.timeToText(ticket.registeredAt, 'hh:mm DD/MM/YYYY') }}
            </td>
            <td>
              <div>
                {{ ticket.customer?.fullName }}
                <a class="ml-1" @click="modalCustomerDetail?.openModal(ticket.customerId)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div v-if="ticket.customer?.note" class="text-xs italic">
                {{ ticket.customer?.note }}
              </div>
              <div
                v-if="
                  settingStore.SCREEN_TICKET_ORDER_LIST.ticketAttributeList &&
                  ticket?.ticketAttributeMap?.note
                "
                class="text-xs italic">
                {{ ticket?.ticketAttributeMap?.note }}
              </div>
            </td>
            <td v-if="settingStore.SCREEN_TICKET_ORDER_LIST.ticketProductList">
              {{ (ticket.ticketProductList || []).map((i) => i.product?.brandName).join(', ') }}
            </td>
            <td class="text-right">
              <div>{{ formatMoney(ticket.totalMoney) }}</div>
              <div v-if="ticket.ticketStatus === TicketStatus.Debt" class="text-xs">
                Nợ: {{ formatMoney(ticket.debt) }}
              </div>
            </td>
            <td v-if="settingStore.SCREEN_TICKET_ORDER_LIST.profit" class="text-right">
              <div>{{ formatMoney(ticket.profit) }}</div>
            </td>
            <td class="text-center">
              <TicketOrderStatusTag :ticketStatus="ticket.ticketStatus" />
            </td>
          </tr>
        </tbody>
      </table>
      <div class="mt-4 float-right mb-2">
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
