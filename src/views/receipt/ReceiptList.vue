<script setup lang="ts">
import { Receipt, ReceiptService, ReceiptStatus } from '@/modules/receipt'
import { useOrganizationStore } from '@/store/organization.store'
import { timeToText } from '@/utils'
import {
  AuditOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  FileSearchOutlined, PlusOutlined, SearchOutlined,
  StopOutlined,
} from '@ant-design/icons-vue'
import type { Dayjs } from 'dayjs'
import { onBeforeMount, ref } from 'vue'
import ModalDistributorDetail from '../distributor/detail/ModalDistributorDetail.vue'

const modalDistributorDetail = ref<InstanceType<typeof ModalDistributorDetail>>()

const organizationStore = useOrganizationStore()
const { formatMoney } = organizationStore

const isMobile = window.innerWidth < 768

const receipts = ref<Receipt[]>([])

const loadingComponent = ref(false)
const page = ref(1)
const limit = ref(Number(localStorage.getItem('RECEIPT_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const timeRanger = ref<[Dayjs, Dayjs]>()
const receiptStatus = ref<ReceiptStatus | null>(null)

const sortColumn = ref<'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const startFetchData = async () => {
  try {
    loadingComponent.value = true
    let sort
    if (sortColumn.value !== '' && sortValue.value !== '') {
      sort = { [sortColumn.value]: sortValue.value }
    }

    const response = await ReceiptService.pagination({
      relation: { distributor: true },
      filter: {
        from_time: timeRanger.value?.[0].startOf('day').valueOf(),
        to_time: timeRanger.value?.[1].endOf('day').valueOf(),
        status: receiptStatus.value ?? undefined,
      },
      page: page.value,
      limit: limit.value,
      sort,
    })

    receipts.value = response.data
    total.value = response.total
    loadingComponent.value = false
  } catch (error) {
    console.log('🚀 ~ file: ReceiptList.vue:52 ~ error:', error)
  }
}

onBeforeMount(async () => {
  await startFetchData()
})

const startSearch = async () => {
  page.value = 1
  await startFetchData()
}

const handleSelectReceiptStatus = async (value: ReceiptStatus | '') => {
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
    localStorage.setItem('RECEIPT_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    // modalSettingArrivalList.value?.openModal()
  }
}

</script>

<template>
  <ModalDistributorDetail ref="modalDistributorDetail" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block">
        <AuditOutlined /> Danh sách phiếu nhập hàng
      </div>
      <a-button type="primary" @click="$router.push({ name: 'ReceiptUpsert', query: { mode: 'CREATE' } })">
        <template #icon>
          <PlusOutlined />
        </template>
        Tạo phiếu nhập mới
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
            </a-menu>
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
        <a-select v-model:value="receiptStatus" allow-clear @change="handleSelectReceiptStatus" class="w-full"
          placeholder="Tất cả">
          <a-select-option :value="null">Tất cả</a-select-option>
          <a-select-option :value="ReceiptStatus.Draft"> Nháp </a-select-option>
          <a-select-option :value="ReceiptStatus.Finish"> Hoàn thành</a-select-option>
          <a-select-option :value="ReceiptStatus.Refund"> Hoàn trả</a-select-option>
        </a-select>
      </div>
      <!-- <div style="flex: 2; flex-basis: 500px;">
        <a-button type="primary" @click="startSearch">Tìm kiếm
          <template #icon>
            <SearchOutlined />
          </template>
        </a-button>
      </div> -->
    </div>

    <div v-if="isMobile" class="page-main-list" style="width: 100%;">
      <table class="table-mobile">
        <thead>
          <tr>
            <th>Nhà cung cấp</th>
            <th>Tiền</th>
            <th>T.Thái</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="receipts.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(receipt, index) in receipts" :key="index"
            @dblclick="$router.push({ name: 'ReceiptDetail', params: { id: receipt.id } })">
            <td>
              <div class="font-medium text-justify">{{ receipt.distributor?.fullName }}
                <a class="text-base" @click="modalDistributorDetail?.openModal(receipt.distributor!)">
                  <FileSearchOutlined class="ml-1" />
                </a>
              </div>
              <div class="text-xs">
                {{ timeToText(receipt.createTime, 'hh:mm DD/MM/YYYY') }}
              </div>
            </td>
            <td class="text-right">
              <div>{{ formatMoney(receipt.totalMoney) }}</div>
              <div v-if="receipt.debt" class="text-xs">
                Nợ: {{ formatMoney(receipt.debt) }}
              </div>
            </td>
            <td class="text-left">
              <a-tag v-if="receipt.status === ReceiptStatus.Draft" color="warning">
                <template #icon>
                  <CheckCircleOutlined />
                </template>
                Nháp
              </a-tag>
              <a-tag v-if="receipt.status === ReceiptStatus.Process" color="processing">
                <template #icon>
                  <ExclamationCircleOutlined />
                </template>
                Đang thực hiện
              </a-tag>
              <a-tag v-if="receipt.status === ReceiptStatus.Finish" color="success">
                <template #icon>
                  <ExclamationCircleOutlined />
                </template>
                Hoàn thành
              </a-tag>
              <a-tag v-if="receipt.status === ReceiptStatus.Refund" color="error">
                <template #icon>
                  <StopOutlined />
                </template>
                Hoàn trả
              </a-tag>
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
            <th>Nhà cung cấp</th>
            <th>Tổng Tiền</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="receipts.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(receipt, index) in receipts" :key="index">
            <td class="text-center">
              <a @click="$router.push({ name: 'ReceiptDetail', params: { id: receipt.id } })">
                RC{{ receipt.id }}
              </a>
            </td>
            <td class="text-center">{{ timeToText(receipt.createTime, 'hh:mm DD/MM/YYYY') }}</td>
            <td>
              <div class="flex justify-between">
                <div>{{ receipt.distributor?.fullName }}</div>
                <a class="text-xl" @click="modalDistributorDetail?.openModal(receipt.distributor!)">
                  <FileSearchOutlined />
                </a>
              </div>
            </td>
            <td class="text-right">{{ formatMoney(receipt.totalMoney) }}</td>
            <td class="text-center">
              <a-tag v-if="receipt.status === ReceiptStatus.Draft" color="warning">
                <template #icon>
                  <ExclamationCircleOutlined />
                </template>
                Nháp
              </a-tag>
              <a-tag v-if="receipt.status === ReceiptStatus.Finish" color="success">
                <template #icon>
                  <CheckCircleOutlined />
                </template>
                Hoàn thành
              </a-tag>
              <a-tag v-if="receipt.status === ReceiptStatus.Refund" color="error">
                <template #icon>
                  <StopOutlined />
                </template>
                Hoàn trả
              </a-tag>
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
