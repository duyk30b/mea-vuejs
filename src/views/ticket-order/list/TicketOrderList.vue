<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import VuePagination from '../../../common/VuePagination.vue'
import { IconDownload, IconFileSearch, IconSetting } from '../../../common/icon-antd'
import { IconSort, IconSortDown, IconSortUp } from '../../../common/icon-font-awesome'
import { IconVisibility } from '../../../common/icon-google'
import VueDropdown from '../../../common/popover/VueDropdown.vue'
import { InputDate, InputOptions, InputSelect, VueSelect } from '../../../common/vue-form'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { MeService } from '../../../modules/_me/me.service'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Customer, CustomerService } from '../../../modules/customer'
import { FileTicketApi } from '../../../modules/file-excel/file-ticket.api'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Ticket, TicketStatus, TicketType } from '../../../modules/ticket'
import { TicketQueryApi } from '../../../modules/ticket/api/ticket-query.api'
import { ESString, ESTimer } from '../../../utils'
import Breadcrumb from '../../component/Breadcrumb.vue'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import TicketStatusTag from '../../ticket-base/TicketStatusTag.vue'
import { ETicketOrderUpsertMode } from '../upsert/ticket-order-upsert.ref'
import ModalTicketOrderListSetting from './ModalTicketOrderListSetting.vue'

const modalTicketOrderListSetting = ref<InstanceType<typeof ModalTicketOrderListSetting>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

const ticketList = ref<Ticket[]>([])
const customerList = ref<Customer[]>([])

const fromTime = ref<number>()
const toTime = ref<number>()

const dataLoading = ref(false)
const page = ref(1)
const limit = ref(Number(localStorage.getItem('TICKET_ORDER_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const status = ref<TicketStatus | null>(null)
const customerId = ref<number>()

const sortColumn = ref<'full_name_en' | 'debt' | 'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const startFetchData = async () => {
  try {
    dataLoading.value = true

    const paginationResult = await TicketQueryApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: {
        customer: true,
        ticketProductList: settingStore.SCREEN_TICKET_ORDER_LIST.ticketProductList
          ? { relation: { product: true } }
          : undefined,
      },
      filter: {
        customerId: customerId.value ? customerId.value : undefined,
        registeredAt:
          fromTime.value || toTime.value
            ? {
                GTE: fromTime.value ? fromTime.value : undefined,
                LT: toTime.value ? toTime.value + 24 * 60 * 60 * 1000 : undefined,
              }
            : undefined,
        status: status.value ? status.value : undefined,
        ticketType: TicketType.Order,
      },
      sort: sortValue.value
        ? {
            id: sortColumn.value === 'id' ? sortValue.value : undefined,
          }
        : { id: 'DESC' },
    })

    ticketList.value = paginationResult.ticketList
    total.value = paginationResult.total
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

const handleChangeTime = async () => {
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

const downloadTicketOrderList = (menu: { key: string }) => {
  ModalStore.confirm({
    title: 'Xác nhận tải file báo cáo',
    content: 'Thời gian tải file có thể tốn vài phút nếu dữ liệu lớn, bạn vẫn mốn tải ?',
    onOk: async () => {
      await FileTicketApi.downloadExcelTicketOrderList({
        filter: {
          customerId: customerId.value ? customerId.value : undefined,
          registeredAt:
            fromTime.value || toTime.value
              ? {
                  GTE: fromTime.value ? fromTime.value : undefined,
                  LT: toTime.value ? toTime.value + 24 * 60 * 60 * 1000 : undefined,
                }
              : undefined,
          status: status.value ? status.value : undefined,
          ticketType: TicketType.Order,
        },
        sort: sortValue.value
          ? {
              id: sortColumn.value === 'id' ? sortValue.value : undefined,
            }
          : { id: 'DESC' },
      })
    },
  })
}
</script>

<template>
  <ModalTicketOrderListSetting
    v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalTicketOrderListSetting"
  />
  <ModalCustomerDetail ref="modalCustomerDetail" />

  <div class="mx-4 mt-4 gap-4 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <div class="hidden md:block">
        <Breadcrumb />
      </div>
      <div class="">
        <VueButton
          color="blue"
          icon="plus"
          @click="
            router.push({
              name: 'TicketOrderUpsert',
              query: { mode: ETicketOrderUpsertMode.CREATE },
            })
          "
        >
          Tạo hóa đơn mới
        </VueButton>
      </div>
    </div>
    <div class="mr-2 flex items-center gap-4 flex-wrap">
      <div>
        <VueButton
          v-if="userPermission[PermissionId.FILE_EXCEL_DOWNLOAD_TICKET_ORDER]"
          :icon="IconDownload"
          @click="downloadTicketOrderList"
        >
          Download
        </VueButton>
      </div>
      <VueDropdown>
        <template #trigger>
          <span style="font-size: 1.2rem; cursor: pointer">
            <IconSetting />
          </span>
        </template>
        <div class="vue-menu">
          <a
            v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
            @click="modalTicketOrderListSetting?.openModal()"
          >
            Cài đặt hiển thị
          </a>
        </div>
      </VueDropdown>
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
            @update:text="searchingCustomer"
          >
            <template #option="{ item: { data } }">
              <div>
                <b>{{ data.fullName }}</b>
                - {{ ESString.formatPhone(data.phone) }} -
                {{ ESTimer.timeToText(data.birthday, 'DD/MM/YYYY') }}
              </div>
              <div>{{ ESString.formatAddress(data) }}</div>
            </template>
          </InputOptions>
        </div>
      </div>

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
            v-model:value="status"
            :options="[
              { text: 'Tất cả', value: null },
              { text: 'Nháp', value: TicketStatus.Draft },
              { text: 'Đặt hàng', value: TicketStatus.Deposited },
              { text: 'Đang xử lý', value: TicketStatus.Executing },
              { text: 'Nợ', value: TicketStatus.Debt },
              { text: 'Hoàn thành', value: TicketStatus.Completed },
              { text: 'Hủy', value: TicketStatus.Cancelled },
            ]"
            @update:value="() => startSearch()"
          ></VueSelect>
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
            @dblclick="router.push({ name: 'TicketOrderDetail', params: { id: ticket.id } })"
          >
            <td>
              <div class="font-medium text-justify">
                {{ ticket.customer?.fullName }}
                <a class="text-base" @click="modalCustomerDetail?.openModal(ticket.customerId)">
                  <IconFileSearch />
                </a>
              </div>
              <div class="text-xs">
                {{ ESTimer.timeToText(ticket.registeredAt, 'hh:mm DD/MM/YYYY') }}
              </div>
              <div v-if="ticket.customer?.note" class="text-xs italic">
                {{ ticket.customer?.note }}
              </div>
              <div
                v-if="settingStore.SCREEN_TICKET_ORDER_LIST.note && ticket?.note"
                class="max-line-1 text-xs italic"
              >
                {{ ticket.note }}
              </div>
            </td>
            <td class="text-right">
              <div>{{ formatMoney(ticket.totalMoney) }}</div>
              <div v-if="ticket.status === TicketStatus.Debt" class="text-xs">
                Nợ: {{ formatMoney(ticket.debt) }}
              </div>
              <div v-if="settingStore.SCREEN_TICKET_ORDER_LIST.profit" class="text-xs italic">
                Lãi: {{ formatMoney(ticket.profit) }}
              </div>
            </td>
            <td><TicketStatusTag :ticket="ticket" /></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!isMobile" class="page-main-table table-wrapper">
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
            <th>Trạng thái</th>
            <th>Thời gian</th>
            <th>Khách hàng</th>
            <th v-if="settingStore.SCREEN_TICKET_ORDER_LIST.ticketProductList">Sản phẩm</th>
            <th v-if="settingStore.SCREEN_TICKET_ORDER_LIST.note">Ghi chú</th>
            <th>Tổng Tiền</th>
            <th v-if="settingStore.SCREEN_TICKET_ORDER_LIST.profit">Lãi</th>
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
            <td><TicketStatusTag :ticket="ticket" /></td>
            <td class="text-center">
              {{ ESTimer.timeToText(ticket.registeredAt, 'hh:mm DD/MM/YYYY') }}
            </td>
            <td>
              <div>
                {{ ticket.customer?.fullName }}
                <a class="ml-1" @click="modalCustomerDetail?.openModal(ticket.customerId)">
                  <IconFileSearch />
                </a>
              </div>
              <div v-if="ticket.customer?.note" class="text-xs italic">
                {{ ticket.customer?.note }}
              </div>
            </td>
            <td v-if="settingStore.SCREEN_TICKET_ORDER_LIST.ticketProductList">
              {{ (ticket.ticketProductList || []).map((i) => i.product?.brandName).join(', ') }}
            </td>
            <td v-if="settingStore.SCREEN_TICKET_ORDER_LIST.note">
              <div class="max-line-2">{{ ticket.note }}</div>
            </td>
            <td class="text-right">
              <div>{{ formatMoney(ticket.totalMoney) }}</div>
              <div v-if="ticket.status === TicketStatus.Debt" class="text-xs">
                Nợ: {{ formatMoney(ticket.debt) }}
              </div>
            </td>
            <td v-if="settingStore.SCREEN_TICKET_ORDER_LIST.profit" class="text-right">
              <div>{{ formatMoney(ticket.profit) }}</div>
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
          { value: 10, label: '10 / page' },
          { value: 20, label: '20 / page' },
          { value: 50, label: '50 / page' },
          { value: 100, label: '100 / page' },
        ]"
      />
    </div>
  </div>
</template>
