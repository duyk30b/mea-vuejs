<script setup lang="ts">
import {
  FileSearchOutlined,
  PlusOutlined,
  ScheduleOutlined,
  FormOutlined,
} from '@ant-design/icons-vue'
import type { Dayjs } from 'dayjs'
import { onBeforeMount, onMounted, ref } from 'vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputOptions, VueSelect } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { useCustomerStore, type Customer } from '../../../modules/customer'
import { Invoice, InvoiceApi, InvoiceStatus } from '../../../modules/invoice'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { timeToText } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import InvoiceStatusTag from '../InvoiceStatusTag.vue'
import { EInvoiceUpsertMode } from '../upsert/invoice-upsert.ref'
import ModalInvoiceListSettingScreen from './ModalInvoiceListSettingScreen.vue'
import VueButton from '../../../common/VueButton.vue'

const modalInvoiceListSettingScreen = ref<InstanceType<typeof ModalInvoiceListSettingScreen>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()

const customerStore = useCustomerStore()
const screenStore = useScreenStore()
const { formatMoney, isMobile } = screenStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const invoiceList = ref<Invoice[]>([])
const customerList = ref<Customer[]>([])

const dataLoading = ref(false)
const page = ref(1)
const limit = ref(Number(localStorage.getItem('INVOICE_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const timeRanger = ref<[Dayjs, Dayjs]>()
const invoiceStatus = ref<InvoiceStatus | null>(null)
const customerId = ref<number>()

const sortColumn = ref<'full_name_en' | 'debt' | 'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const startFetchData = async () => {
  try {
    dataLoading.value = true

    const fromTime = timeRanger.value?.[0].startOf('day').toDate()
    const toTime = timeRanger.value?.[1].endOf('day').toDate()

    const { data, meta } = await InvoiceApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: { customer: true },
      filter: {
        customerId: customerId.value ? customerId.value : undefined,
        startedAt: {
          GTE: fromTime ? fromTime : undefined,
          LTE: toTime ? toTime : undefined,
        },
        deletedAt: { IS_NULL: true },
        status: invoiceStatus.value ?? undefined, // Refund = 0 nhé
      },
      sort: sortValue.value
        ? {
            id: sortColumn.value === 'id' ? sortValue.value : undefined,
          }
        : { id: 'DESC' },
    })

    invoiceList.value = data
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
    localStorage.setItem('INVOICE_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalInvoiceListSettingScreen.value?.openModal()
  }
}
</script>

<template>
  <ModalInvoiceListSettingScreen
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_SCREEN]"
    ref="modalInvoiceListSettingScreen"
  />
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block"><ScheduleOutlined class="mr-1" /> Danh sách hóa đơn</div>
      <div>
        <VueButton
          v-if="permissionIdMap[PermissionId.INVOICE_CREATE_DRAFT]"
          color="blue"
          @click="
            $router.push({ name: 'InvoiceUpsert', query: { mode: EInvoiceUpsertMode.CREATE } })
          "
        >
          <template #icon>
            <PlusOutlined />
          </template>
          Tạo hóa đơn mới
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
        <div>Tên khách hàng</div>
        <div>
          <InputOptions
            ref="inputOptionsCustomer"
            :options="customerList.map((i) => ({ value: i.id, text: i.fullName, data: i }))"
            :maxHeight="260"
            placeholder="Tìm kiếm bằng Tên hoặc Số Điện Thoại"
            @selectItem="({ data }) => selectCustomer(data)"
            @update:text="searchingCustomer"
          >
            <template #option="{ item: { data } }">
              <div>
                <b>{{ data.fullName }}</b> - {{ data.phone }} -
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
            :placeholder="['DD-MM-YYYY', 'DD-MM-YYYY']"
          />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 250px">
        <div>Chọn trạng thái</div>
        <div>
          <VueSelect
            v-model:value="invoiceStatus"
            :options="[
              { text: 'Tất cả', value: null },
              { text: 'Nháp', value: InvoiceStatus.Draft },
              { text: 'Tạm ứng (Chờ gửi hàng)', value: InvoiceStatus.Prepayment },
              { text: 'Nợ (Đã gửi hàng)', value: InvoiceStatus.Debt },
              { text: 'Hoàn thành', value: InvoiceStatus.Success },
              { text: 'Hoàn trả', value: InvoiceStatus.Refund },
            ]"
            @update:value="(e) => startSearch()"
          >
          </VueSelect>
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
          <tr v-if="invoiceList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr
            v-for="(invoice, index) in invoiceList"
            :key="index"
            @dblclick="$router.push({ name: 'InvoiceDetail', params: { id: invoice.id } })"
          >
            <td>
              <div class="font-medium text-justify">
                {{ invoice.customer?.fullName }}
                <a class="text-base" @click="modalCustomerDetail?.openModal(invoice.customerId)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div class="text-xs">
                {{ timeToText(invoice.startedAt, 'hh:mm DD/MM/YYYY') }}
              </div>
              <div v-if="invoice.customer?.note" class="text-xs italic">
                {{ invoice.customer?.note }}
              </div>
            </td>
            <td class="text-right">
              <div>{{ formatMoney(invoice.totalMoney) }}</div>
              <div v-if="invoice.status === InvoiceStatus.Debt" class="text-xs">
                Nợ: {{ formatMoney(invoice.debt) }}
              </div>
              <div v-if="invoice.status === InvoiceStatus.Prepayment" class="text-xs">
                Đã thanh toán: {{ formatMoney(invoice.paid) }}
              </div>
            </td>
            <td>
              <InvoiceStatusTag :status="invoice.status" />
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
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })"
        />
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
                style="opacity: 0.4"
              />
              <font-awesome-icon
                v-if="sortColumn === 'id' && sortValue === 'ASC'"
                :icon="['fas', 'sort-up']"
              />
              <font-awesome-icon
                v-if="sortColumn === 'id' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']"
              />
            </th>
            <th>Thời gian</th>
            <th>Khách hàng</th>
            <th>Tổng Tiền</th>
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
          <tr v-if="invoiceList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(invoice, index) in invoiceList" :key="index">
            <td class="text-center">IV{{ invoice.id }}</td>
            <td class="text-center">
              {{ timeToText(invoice.startedAt, 'hh:mm DD/MM/YYYY') }}
            </td>
            <td>
              <div>
                {{ invoice.customer?.fullName }}
                <a class="ml-1" @click="modalCustomerDetail?.openModal(invoice.customerId)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div v-if="invoice.customer?.note" class="text-xs italic">
                {{ invoice.customer?.note }}
              </div>
            </td>
            <td class="text-right">
              <div>{{ formatMoney(invoice.totalMoney) }}</div>
              <div v-if="invoice.status === InvoiceStatus.Debt" class="text-xs">
                Nợ: {{ formatMoney(invoice.debt) }}
              </div>
              <div v-if="invoice.status === InvoiceStatus.Prepayment" class="text-xs">
                Đã thanh toán: {{ formatMoney(invoice.paid) }}
              </div>
            </td>
            <td class="text-center">
              <InvoiceStatusTag :status="invoice.status" />
            </td>
            <td v-if="permissionIdMap[PermissionId.INVOICE_READ]" class="text-center">
              <router-link :to="{ name: 'InvoiceDetail', params: { id: invoice.id } }">
                <span style="color: #eca52b" class="text-xl">
                  <FormOutlined />
                </span>
              </router-link>
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
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })"
        />
      </div>
    </div>
  </div>
</template>
