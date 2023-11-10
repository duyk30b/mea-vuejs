<script setup lang="ts">
import { Invoice, InvoiceService, InvoiceStatus } from '@/modules/invoice'
import { useOrganizationStore } from '@/store/organization.store'
import { timeToText } from '@/utils'
import {
  FileSearchOutlined, PlusOutlined,
  ScheduleOutlined,
} from '@ant-design/icons-vue'
import type { Dayjs } from 'dayjs'
import { onBeforeMount, onMounted, ref } from 'vue'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import InvoiceStatusTag from '../InvoiceStatusTag.vue'
import ModalInvoiceListSettingScreen from './ModalInvoiceListSettingScreen.vue'

const modalInvoiceListSettingScreen = ref<InstanceType<typeof ModalInvoiceListSettingScreen>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()

const organizationStore = useOrganizationStore()
const { formatMoney, isMobile } = organizationStore

const invoiceList = ref<Invoice[]>([])

const loadingComponent = ref(false)
const page = ref(1)
const limit = ref(Number(localStorage.getItem('INVOICE_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const timeRanger = ref<[Dayjs, Dayjs]>()
const invoiceStatus = ref<InvoiceStatus | null>(null)

const sortColumn = ref<'full_name_en' | 'debt' | 'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const startFetchData = async () => {
  try {
    loadingComponent.value = true
    let sort
    if (sortColumn.value !== '' && sortValue.value !== '') {
      sort = { [sortColumn.value]: sortValue.value }
    }

    const response = await InvoiceService.pagination({
      page: page.value,
      limit: limit.value,
      relation: { customer: true },
      filter: {
        from_time: timeRanger.value?.[0].startOf('day').valueOf(),
        to_time: timeRanger.value?.[1].endOf('day').valueOf(),
        status: invoiceStatus.value ?? undefined, // Refund = 0 nhé
      },
      sort,
    })

    invoiceList.value = response.data
    total.value = response.total
    loadingComponent.value = false
  } catch (error) {
    console.log('🚀 ~ file: InvoiceList.vue:50 ~ error:', error)
  }
}

onBeforeMount(async () => {
  await startFetchData()
})

onMounted(async () => {
  try {
    // await CustomerService
  } catch (error) {
    console.log('🚀 ~ file: InvoiceList.vue:66 ~ onMounted ~ error:', error)
  }
})

const startSearch = async () => {
  page.value = 1
  await startFetchData()
}

const handleSelectInvoiceStatus = async (value?: InvoiceStatus) => {
  await startSearch()
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

const changePagination = async (options: { page?: number, limit?: number }) => {
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
  <ModalInvoiceListSettingScreen ref="modalInvoiceListSettingScreen" />
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block">
        <ScheduleOutlined /> Danh sách hóa đơn
      </div>
      <a-button type="primary" @click="$router.push({ name: 'InvoiceUpsert', query: { mode: 'CREATE' } })">
        <template #icon>
          <PlusOutlined />
        </template>
        Tạo hóa đơn mới
      </a-button>
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
      <div style="flex: 1; flex-basis: 250px;">
        <div>Chọn thời gian</div>
        <div>
          <a-range-picker v-model:value="timeRanger" :onChange="handleChangeTime" format="DD-MM-YYYY" style="width: 100%"
            :placeholder="['DD-MM-YYYY', 'DD-MM-YYYY']" />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 250px;">
        <div>Chọn trạng thái</div>
        <a-select v-model:value="invoiceStatus" allow-clear @change="handleSelectInvoiceStatus" class="w-full"
          placeholder="Tất cả">
          <a-select-option :value="null">Tất cả</a-select-option>
          <a-select-option :value="InvoiceStatus.Draft"> Nháp</a-select-option>
          <a-select-option :value="InvoiceStatus.AwaitingShipment"> Chờ gửi hàng </a-select-option>
          <a-select-option :value="InvoiceStatus.Debt"> Nợ </a-select-option>
          <a-select-option :value="InvoiceStatus.Success"> Hoàn thành </a-select-option>
          <a-select-option :value="InvoiceStatus.Refund"> Hoàn trả </a-select-option>
        </a-select>
      </div>
    </div>

    <div v-if="isMobile" class="page-main-list">
      <table class="table-mobile">
        <thead>
          <tr>
            <th>Khách hàng</th>
            <th>Tiền Đơn</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="invoiceList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(invoice, index) in invoiceList" :key="index"
            @dblclick="$router.push({ name: 'InvoiceDetail', params: { id: invoice.id } })">
            <td>
              <div class="font-medium text-justify">{{ invoice.customer?.fullName }}
                <a class="text-base" @click="modalCustomerDetail?.openModal(invoice.customer!)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div class="text-xs">
                {{ timeToText(invoice.createTime, 'hh:mm DD/MM/YYYY') }}
              </div>
            </td>
            <td class="text-right">
              <div>{{ formatMoney(invoice.totalMoney) }}</div>
              <div v-if="invoice.status === InvoiceStatus.Debt" class="text-xs">
                Nợ: {{ formatMoney(invoice.debt) }}
              </div>
              <div v-if="invoice.status === InvoiceStatus.AwaitingShipment" class="text-xs">
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
        <a-pagination size="small" v-model:current="page" v-model:pageSize="limit" :total="total" show-size-changer
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })" />
      </div>
    </div>

    <div v-else class="page-main-table table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th class="cursor-pointer" @click="changeSort('id')">Mã &nbsp;
              <font-awesome-icon v-if="sortColumn !== 'id'" :icon="['fas', 'sort']" style="opacity: 0.4;" />
              <font-awesome-icon v-if="sortColumn === 'id' && sortValue === 'ASC'" :icon="['fas', 'sort-up']" />
              <font-awesome-icon v-if="sortColumn === 'id' && sortValue === 'DESC'" :icon="['fas', 'sort-down']" />
            </th>
            <th>Thời gian</th>
            <th>Khách hàng</th>
            <th>Tổng Tiền</th>
            <th>Thanh toán</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="invoiceList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(invoice, index) in invoiceList" :key="index">
            <td class="text-center">
              <a @click="$router.push({ name: 'InvoiceDetail', params: { id: invoice.id } })">
                IV{{ invoice.id }}
              </a>
            </td>
            <td class="text-center">{{ timeToText(invoice.createTime, 'hh:mm DD/MM/YYYY') }}</td>
            <td>
              {{ invoice.customer?.fullName }}
              <a class="ml-1" @click="modalCustomerDetail?.openModal(invoice.customer!)">
                <FileSearchOutlined />
              </a>
            </td>
            <td class="text-right">
              <div>{{ formatMoney(invoice.totalMoney) }}</div>
              <div v-if="invoice.status === InvoiceStatus.Debt" class="text-xs">
                Nợ: {{ formatMoney(invoice.debt) }}
              </div>
              <div v-if="invoice.status === InvoiceStatus.AwaitingShipment" class="text-xs">
                Đã thanh toán: {{ formatMoney(invoice.paid) }}
              </div>
            </td>
            <td class="text-center">
              <InvoiceStatusTag :status="invoice.status" />
            </td>
          </tr>
        </tbody>
      </table>
      <div class="mt-4 float-right mb-2">
        <a-pagination v-model:current="page" v-model:pageSize="limit" :total="total" show-size-changer
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })" />
      </div>
    </div>
  </div>
</template>
