<script setup lang="ts">
import { onBeforeMount, onMounted, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VuePagination from '../../../common/VuePagination.vue'
import VueTag from '../../../common/VueTag.vue'
import {
  IconDownload,
  IconFileSearch,
  IconForm,
  IconSetting,
  IconUpload,
} from '../../../common/icon-antd'
import { IconSort, IconSortDown, IconSortUp } from '../../../common/icon-font-awesome'
import VueDropdown from '../../../common/popover/VueDropdown.vue'
import { InputSelect, InputText, VueSelect } from '../../../common/vue-form'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { MeService } from '../../../modules/_me/me.service'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Customer, CustomerService } from '../../../modules/customer'
import { FileCustomerApi } from '../../../modules/file-excel/file-customer.api'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { ESString, ESTimer } from '../../../utils'
import Breadcrumb from '../../component/Breadcrumb.vue'
import ModalCustomerPayDebt from '../ModalCustomerPayDebt.vue'
import ModalCustomerDetail from '../detail/ModalCustomerDetail.vue'
import ModalCustomerUpsert from '../upsert/ModalCustomerUpsert.vue'
import ModalCustomerListSettingScreen from './ModalCustomerListSettingScreen.vue'
import ModalUploadCustomer from './ModalUploadCustomer.vue'
import { CONFIG } from '@/config'

const modalCustomerUpsert = ref<InstanceType<typeof ModalCustomerUpsert>>()
const modalCustomerPayDebt = ref<InstanceType<typeof ModalCustomerPayDebt>>()
const modalCustomerListSettingScreen = ref<InstanceType<typeof ModalCustomerListSettingScreen>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalUploadCustomer = ref<InstanceType<typeof ModalUploadCustomer>>()

const settingStore = useSettingStore()
const { userPermission } = MeService
const { formatMoney, isMobile } = settingStore

const customerList = ref<Customer[]>([])

const dataLoading = ref(false)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('CUSTOMER_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const searchText = ref('')
const isActive = ref<1 | 0 | ''>(1)

const sortColumn = ref<'id' | 'customerCode' | 'fullName' | 'debt' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const startFetchData = async (options?: { refetch?: boolean }) => {
  try {
    const response = await CustomerService.pagination(
      {
        page: page.value,
        limit: limit.value,
        filter: {
          isActive: isActive.value !== '' ? isActive.value : undefined,
          searchText: searchText.value ? searchText.value : undefined,
        },
        sort: sortValue.value
          ? {
              fullName: sortColumn.value === 'fullName' ? sortValue.value : undefined,
              id: sortColumn.value === 'id' ? sortValue.value : undefined,
              debt: sortColumn.value === 'debt' ? sortValue.value : undefined,
            }
          : { customerCode: 'ASC' },
      },
      { refetch: options?.refetch },
    )

    customerList.value = response.data
    total.value = response.total
  } catch (error) {
    console.log('🚀 ~ file: CustomerList.vue:59 ~ startFetchData ~ error:', error)
  }
}

onBeforeMount(async () => {
  dataLoading.value = true
  await startFetchData()
  dataLoading.value = false
})

onMounted(async () => {
  const customerRefresh = await CustomerService.refreshDB() // reload nếu có dữ liệu mới nhất
  if (customerRefresh?.numberChange) {
    await startFetchData()
  }
})

onBeforeMount(async () => {
  dataLoading.value = true
  await startFetchData()
  dataLoading.value = false
})

const startSearch = async () => {
  page.value = 1
  await startFetchData()
}

const changeSort = async (column: 'id' | 'customerCode' | 'fullName' | 'debt') => {
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
    localStorage.setItem('CUSTOMER_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

const updateCustomer = async (data: Customer) => {
  await startFetchData()
}

const handleModalCustomerUpsertSuccess = async () => {
  await startFetchData()
}

const handleModalCustomerPayDebtSuccess = async (data: { customer: Customer }) => {
  // await startFetchData()
  const index = customerList.value.findIndex((i) => i.id === data.customer.id)
  if (index !== -1) {
    customerList.value[index] = Customer.from(data.customer)
  }
}

const downloadExcelCustomerList = async () => {
  ModalStore.confirm({
    title: 'Xác nhận tải file báo cáo',
    content: 'Thời gian tải file có thể tốn vài phút nếu dữ liệu lớn, bạn vẫn mốn tải ?',
    onOk: async () => {
      await FileCustomerApi.downloadExcel()
    },
  })
}

const handleModalUploadCustomerSuccess = async () => {
  await startFetchData({ refetch: true })
}
</script>

<template>
  <ModalCustomerUpsert ref="modalCustomerUpsert" @success="handleModalCustomerUpsertSuccess" />
  <ModalCustomerDetail ref="modalCustomerDetail" @update_customer="updateCustomer" />
  <ModalCustomerPayDebt ref="modalCustomerPayDebt" @success="handleModalCustomerPayDebtSuccess" />
  <ModalCustomerListSettingScreen
    v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalCustomerListSettingScreen"
  />
  <ModalUploadCustomer ref="modalUploadCustomer" @success="handleModalUploadCustomerSuccess" />

  <div class="mx-4 mt-4 gap-4 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <div class="hidden md:block">
        <Breadcrumb />
      </div>
      <div class="">
        <VueButton
          v-if="userPermission[PermissionId.CUSTOMER_CREATE]"
          color="blue"
          icon="plus"
          @click="modalCustomerUpsert?.openModal()"
        >
          Thêm mới
        </VueButton>
      </div>
    </div>
    <div class="mr-2 flex items-center gap-4 flex-wrap">
      <div v-if="!isMobile">
        <VueButton
          v-if="userPermission[PermissionId.FILE_EXCEL_UPLOAD_CUSTOMER]"
          :icon="IconUpload"
          @click="modalUploadCustomer?.openModal()"
        >
          Upload
        </VueButton>
      </div>
      <div v-if="!isMobile">
        <VueButton
          v-if="userPermission[PermissionId.FILE_EXCEL_DOWNLOAD_CUSTOMER]"
          :icon="IconDownload"
          @click="downloadExcelCustomerList"
        >
          Download
        </VueButton>
      </div>
      <VueDropdown v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]">
        <template #trigger>
          <span style="font-size: 1.2rem; cursor: pointer">
            <IconSetting />
          </span>
        </template>
        <div class="vue-menu">
          <a @click="modalCustomerListSettingScreen?.openModal()">Cài đặt hiển thị</a>
        </div>
      </VueDropdown>
    </div>
  </div>

  <div class="page-main">
    <div class="page-main-options">
      <div style="flex: 2; flex-basis: 500px">
        <div>Tìm kiếm</div>
        <div>
          <InputText v-model:value="searchText" @update:value="startSearch" />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 300px">
        <div>Chọn trạng thái</div>
        <div>
          <VueSelect
            v-model:value="isActive"
            :options="[
              { text: 'Tất cả', value: '' },
              { text: 'Active', value: 1 },
              { text: 'Inactive', value: 0 },
            ]"
            @update:value="(e) => startSearch()"
          />
        </div>
      </div>
    </div>

    <div v-if="isMobile" class="page-main-list table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Tên KH</th>
            <th v-if="settingStore.SCREEN_CUSTOMER_LIST.phone">SĐT</th>
            <th class="cursor-pointer whitespace-nowrap" @click="changeSort('debt')">
              <div class="flex items-center gap-1 justify-center">
                <span>Nợ</span>
                <IconSort v-if="sortColumn !== 'debt'" style="opacity: 0.4" />
                <IconSortUp
                  v-if="sortColumn === 'debt' && sortValue === 'ASC'"
                  style="opacity: 0.4"
                />
                <IconSortDown
                  v-if="sortColumn === 'debt' && sortValue === 'DESC'"
                  style="opacity: 0.4"
                />
              </div>
            </th>
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
          <tr v-if="customerList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr
            v-for="(customer, index) in customerList"
            :key="index"
            @dblclick="
              userPermission[PermissionId.CUSTOMER_UPDATE] &&
              modalCustomerUpsert?.openModal(customer)
            "
          >
            <td style="border-right: none">
              <div class="font-medium text-justify">
                {{ customer.fullName }}
                <a
                  v-if="settingStore.SCREEN_CUSTOMER_LIST.detail"
                  class="text-base"
                  @click="modalCustomerDetail?.openModal(customer.id)"
                >
                  <IconFileSearch />
                </a>
              </div>
              <div v-if="settingStore.SCREEN_CUSTOMER_LIST.address" class="text-xs text-justify">
                {{ ESString.formatAddress(customer) }}
              </div>
              <div class="flex gap-4 text-xs">
                <div v-if="settingStore.SCREEN_CUSTOMER_LIST.birthday" class="text-center">
                  {{ ESTimer.timeToText(customer.birthday, 'DD/MM/YYYY') }}
                </div>
                <div
                  v-if="settingStore.SCREEN_CUSTOMER_LIST.gender && customer.gender != null"
                  class="text-center"
                >
                  {{ customer.gender ? 'Nam' : 'Nữ' }}
                </div>
              </div>
              <div
                v-if="settingStore.SCREEN_CUSTOMER_LIST.note && customer.note"
                class="text-xs italic"
              >
                {{ customer.note }}
              </div>
            </td>
            <td
              v-if="settingStore.SCREEN_CUSTOMER_LIST.phone"
              style="white-space: nowrap; border-left: none; border-right: none"
            >
              <a :href="'tel:' + customer.phone">
                {{ ESString.formatPhone(customer.phone || '') }}
              </a>
            </td>
            <td class="text-right" style="border-left: none">
              <div style="white-space: nowrap">{{ formatMoney(customer.debt) }}</div>
              <div
                v-if="userPermission[PermissionId.PAYMENT_CUSTOMER_PAYMENT] && customer.debt != 0"
              >
                <VueButton
                  color="default"
                  size="small"
                  @click="modalCustomerPayDebt?.openModal(customer.id)"
                >
                  Trả nợ
                </VueButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!isMobile" class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th
              v-if="CONFIG.MODE === 'development'"
              class="cursor-pointer"
              @click="changeSort('id')"
            >
              <div class="flex items-center gap-1 justify-center">
                <span>ID</span>
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
            <th class="cursor-pointer" @click="changeSort('customerCode')">
              <div class="flex items-center gap-1 justify-center">
                <span>Mã KH</span>
                <IconSort v-if="sortColumn !== 'customerCode'" style="opacity: 0.4" />
                <IconSortUp
                  v-if="sortColumn === 'customerCode' && sortValue === 'ASC'"
                  style="opacity: 0.4"
                />
                <IconSortDown
                  v-if="sortColumn === 'customerCode' && sortValue === 'DESC'"
                  style="opacity: 0.4"
                />
              </div>
            </th>
            <th class="cursor-pointer" @click="changeSort('fullName')">
              <div class="flex items-center gap-1 justify-center">
                <span>Họ Tên</span>
                <IconSort v-if="sortColumn !== 'fullName'" style="opacity: 0.4" />
                <IconSortUp
                  v-if="sortColumn === 'fullName' && sortValue === 'ASC'"
                  style="opacity: 0.4"
                />
                <IconSortDown
                  v-if="sortColumn === 'fullName' && sortValue === 'DESC'"
                  style="opacity: 0.4"
                />
              </div>
            </th>
            <th v-if="settingStore.SCREEN_CUSTOMER_LIST.phone">SĐT</th>
            <th v-if="settingStore.SCREEN_CUSTOMER_LIST.gender">Giới tính</th>
            <th v-if="settingStore.SCREEN_CUSTOMER_LIST.birthday">Ngày sinh</th>
            <th class="cursor-pointer" @click="changeSort('debt')">
              <div class="flex items-center gap-1 justify-center">
                <span>Nợ</span>
                <IconSort v-if="sortColumn !== 'debt'" style="opacity: 0.4" />
                <IconSortUp
                  v-if="sortColumn === 'debt' && sortValue === 'ASC'"
                  style="opacity: 0.4"
                />
                <IconSortDown
                  v-if="sortColumn === 'debt' && sortValue === 'DESC'"
                  style="opacity: 0.4"
                />
              </div>
            </th>
            <th v-if="settingStore.SCREEN_CUSTOMER_LIST.isActive">Trạng thái</th>
            <th
              v-if="
                userPermission[PermissionId.CUSTOMER_UPDATE] &&
                settingStore.SCREEN_CUSTOMER_LIST.action
              "
            >
              Sửa
            </th>
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
          <tr v-if="customerList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(customer, index) in customerList" :key="index">
            <td v-if="CONFIG.MODE === 'development'" class="text-center">{{ customer.id }}</td>
            <td class="text-center">{{ customer.customerCode }}</td>
            <td>
              <div>
                {{ customer.fullName }}
                <a
                  v-if="settingStore.SCREEN_CUSTOMER_LIST.detail"
                  class="ml-1"
                  @click="modalCustomerDetail?.openModal(customer.id)"
                >
                  <IconFileSearch />
                </a>
              </div>
              <div
                v-if="settingStore.SCREEN_CUSTOMER_LIST.note && customer.note"
                class="text-xs italic"
              >
                {{ customer.note }}
              </div>
              <div v-if="settingStore.SCREEN_CUSTOMER_LIST.address" class="text-xs italic">
                {{ ESString.formatAddress(customer) }}
              </div>
            </td>
            <td v-if="settingStore.SCREEN_CUSTOMER_LIST.phone" class="text-center">
              <a :href="'tel:' + customer.phone">{{ customer.phone }}</a>
            </td>
            <td v-if="settingStore.SCREEN_CUSTOMER_LIST.gender" class="text-center">
              <span v-if="customer.gender != null">{{ customer.gender ? 'Nam' : 'Nữ' }}</span>
            </td>
            <td v-if="settingStore.SCREEN_CUSTOMER_LIST.birthday" class="text-center">
              {{
                ESTimer.timeToText(customer.birthday, 'DD/MM/YYYY') || customer.yearOfBirth || ''
              }}
            </td>
            <td class="text-right">
              <div class="flex justify-between gap-1 items-center">
                <div>
                  <VueButton
                    v-if="
                      userPermission[PermissionId.PAYMENT_CUSTOMER_PAYMENT] && customer.debt != 0
                    "
                    size="small"
                    @click="modalCustomerPayDebt?.openModal(customer.id)"
                  >
                    Trả nợ
                  </VueButton>
                </div>
                <div class="ml-2">
                  {{ formatMoney(customer.debt) }}
                </div>
              </div>
            </td>
            <td v-if="settingStore.SCREEN_CUSTOMER_LIST.isActive" class="text-center">
              <VueTag v-if="customer.isActive" color="green" icon="check">Active</VueTag>
              <VueTag v-else color="orange" icon="minus">Inactive</VueTag>
            </td>
            <td
              v-if="
                userPermission[PermissionId.CUSTOMER_UPDATE] &&
                settingStore.SCREEN_CUSTOMER_LIST.action
              "
              class="text-center"
            >
              <a
                style="color: #eca52b"
                class="text-xl"
                @click="modalCustomerUpsert?.openModal(customer)"
              >
                <IconForm />
              </a>
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
