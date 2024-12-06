<script setup lang="ts">
import {
  CheckCircleOutlined,
  ContactsOutlined,
  FileSearchOutlined,
  FormOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons-vue'
import { onBeforeMount, onMounted, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconDownload, IconSetting } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputText, VueSelect } from '../../../common/vue-form'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { CustomerApi, CustomerService, type Customer } from '../../../modules/customer'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { DString, DTimer } from '../../../utils'
import ModalCustomerPayDebt from '../ModalCustomerPayDebt.vue'
import ModalCustomerDetail from '../detail/ModalCustomerDetail.vue'
import ModalCustomerUpsert from '../upsert/ModalCustomerUpsert.vue'
import ModalCustomerListSettingScreen from './ModalCustomerListSettingScreen.vue'

const modalCustomerUpsert = ref<InstanceType<typeof ModalCustomerUpsert>>()
const modalCustomerPayDebt = ref<InstanceType<typeof ModalCustomerPayDebt>>()
const modalCustomerListSettingScreen = ref<InstanceType<typeof ModalCustomerListSettingScreen>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()

const settingStore = useSettingStore()
const meStore = useMeStore()
const { permissionIdMap } = meStore
const { formatMoney, isMobile } = settingStore

const customerList = ref<Customer[]>([])

const dataLoading = ref(false)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('CUSTOMER_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const searchText = ref('')
const isActive = ref<1 | 0 | ''>(1)

const sortColumn = ref<'fullName' | 'debt' | 'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const startFetchData = async () => {
  try {
    const response = await CustomerService.pagination({
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
        : { id: 'DESC' },
    })

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
  try {
    const { numberChange } = await CustomerService.refreshDB() // reload nếu có dữ liệu mới nhất
    if (numberChange > 0) {
      await startFetchData()
    }
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
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

const changeSort = async (column: 'fullName' | 'debt' | 'id') => {
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

const handleModalCustomerPayDebtSuccess = async () => {
  await startFetchData()
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalCustomerListSettingScreen.value?.openModal()
  }
}

const downloadExcelCustomerList = async () => {
  ModalStore.confirm({
    title: 'Xác nhận tải file báo cáo',
    content: 'Thời gian tải file có thể tốn vài phút nếu dữ liệu lớn, bạn vẫn mốn tải ?',
    onOk: async () => {
      await CustomerApi.downloadExcelCustomerList()
    },
  })
}
</script>

<template>
  <ModalCustomerUpsert ref="modalCustomerUpsert" @success="handleModalCustomerUpsertSuccess" />
  <ModalCustomerDetail ref="modalCustomerDetail" @update_customer="updateCustomer" />
  <ModalCustomerPayDebt
    ref="modalCustomerPayDebt"
    @success="handleModalCustomerPayDebtSuccess" />
  <ModalCustomerListSettingScreen
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalCustomerListSettingScreen" />

  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block">
        <ContactsOutlined />
        Danh sách khách hàng
      </div>
      <VueButton
        v-if="permissionIdMap[PermissionId.CUSTOMER_CREATE]"
        color="blue"
        icon="plus"
        @click="modalCustomerUpsert?.openModal()">
        Thêm mới
      </VueButton>
    </div>
    <div class="flex mr-2 gap-8">
      <div style="cursor: pointer">
        <IconDownload width="20" height="20" @click="downloadExcelCustomerList" />
      </div>
      <span style="cursor: pointer">
        <a-dropdown
          v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
          trigger="click">
          <span>
            <IconSetting width="20" height="20" />
          </span>
          <template #overlay>
            <a-menu @click="handleMenuSettingClick">
              <a-menu-item key="screen-setting">Cài đặt hiển thị</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </span>
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
            @update:value="(e) => startSearch()" />
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
              Nợ &nbsp;
              <font-awesome-icon
                v-if="sortColumn !== 'debt'"
                :icon="['fas', 'sort']"
                style="opacity: 0.4" />
              <font-awesome-icon
                v-if="sortColumn === 'debt' && sortValue === 'ASC'"
                :icon="['fas', 'sort-up']" />
              <font-awesome-icon
                v-if="sortColumn === 'debt' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']" />
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
              permissionIdMap[PermissionId.CUSTOMER_UPDATE] &&
                modalCustomerUpsert?.openModal(customer)
            ">
            <td style="border-right: none">
              <div class="font-medium text-justify">
                {{ customer.fullName }}
                <a
                  v-if="settingStore.SCREEN_CUSTOMER_LIST.detail"
                  class="text-base"
                  @click="modalCustomerDetail?.openModal(customer)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div v-if="settingStore.SCREEN_CUSTOMER_LIST.address" class="text-xs text-justify">
                {{ DString.formatAddress(customer) }}
              </div>
              <div class="flex gap-4 text-xs">
                <div v-if="settingStore.SCREEN_CUSTOMER_LIST.birthday" class="text-center">
                  {{ DTimer.timeToText(customer.birthday, 'DD/MM/YYYY') }}
                </div>
                <div
                  v-if="settingStore.SCREEN_CUSTOMER_LIST.gender && customer.gender != null"
                  class="text-center">
                  {{ customer.gender ? 'Nam' : 'Nữ' }}
                </div>
              </div>
              <div
                v-if="settingStore.SCREEN_CUSTOMER_LIST.note && customer.note"
                class="text-xs italic">
                {{ customer.note }}
              </div>
            </td>
            <td
              v-if="settingStore.SCREEN_CUSTOMER_LIST.phone"
              style="white-space: nowrap; border-left: none; border-right: none">
              <a :href="'tel:' + customer.phone">{{ DString.formatPhone(customer.phone || '') }}</a>
            </td>
            <td class="text-right" style="border-left: none">
              <div style="white-space: nowrap">{{ formatMoney(customer.debt) }}</div>
              <div v-if="permissionIdMap[PermissionId.CUSTOMER_PAY_DEBT] && customer.debt != 0">
                <VueButton
                  color="default"
                  size="small"
                  @click="modalCustomerPayDebt?.openModal(customer)">
                  Trả nợ
                </VueButton>
              </div>
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
              Mã KH &nbsp;
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
            <th class="cursor-pointer" @click="changeSort('fullName')">
              Họ Tên &nbsp;
              <font-awesome-icon
                v-if="sortColumn !== 'fullName'"
                :icon="['fas', 'sort']"
                style="opacity: 0.4" />
              <font-awesome-icon
                v-if="sortColumn === 'fullName' && sortValue === 'ASC'"
                :icon="['fas', 'sort-up']" />
              <font-awesome-icon
                v-if="sortColumn === 'fullName' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']" />
            </th>
            <th v-if="settingStore.SCREEN_CUSTOMER_LIST.phone">SĐT</th>
            <th v-if="settingStore.SCREEN_CUSTOMER_LIST.gender">Giới tính</th>
            <th v-if="settingStore.SCREEN_CUSTOMER_LIST.birthday">Ngày sinh</th>
            <th v-if="settingStore.SCREEN_CUSTOMER_LIST.address">Địa Chỉ</th>
            <th class="cursor-pointer" @click="changeSort('debt')">
              Nợ &nbsp;
              <font-awesome-icon
                v-if="sortColumn !== 'debt'"
                :icon="['fas', 'sort']"
                style="opacity: 0.4" />
              <font-awesome-icon
                v-if="sortColumn === 'debt' && sortValue === 'ASC'"
                :icon="['fas', 'sort-up']" />
              <font-awesome-icon
                v-if="sortColumn === 'debt' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']" />
            </th>
            <th v-if="settingStore.SCREEN_CUSTOMER_LIST.isActive">Trạng thái</th>
            <th
              v-if="
                permissionIdMap[PermissionId.CUSTOMER_UPDATE] &&
                settingStore.SCREEN_CUSTOMER_LIST.action
              ">
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
            <td class="text-center">KH{{ customer.id }}</td>
            <td>
              <div>
                {{ customer.fullName }}
                <a
                  v-if="settingStore.SCREEN_CUSTOMER_LIST.detail"
                  class="ml-1"
                  @click="modalCustomerDetail?.openModal(customer)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div
                v-if="settingStore.SCREEN_CUSTOMER_LIST.note && customer.note"
                class="text-xs italic">
                {{ customer.note }}
              </div>
            </td>
            <td v-if="settingStore.SCREEN_CUSTOMER_LIST.phone" class="text-center">
              <a :href="'tel:' + customer.phone">{{ customer.phone }}</a>
            </td>
            <td v-if="settingStore.SCREEN_CUSTOMER_LIST.gender" class="text-center">
              <span v-if="customer.gender != null">{{ customer.gender ? 'Nam' : 'Nữ' }}</span>
            </td>
            <td v-if="settingStore.SCREEN_CUSTOMER_LIST.birthday" class="text-center">
              {{ DTimer.timeToText(customer.birthday, 'DD/MM/YYYY') || customer.yearOfBirth || '' }}
            </td>

            <td v-if="settingStore.SCREEN_CUSTOMER_LIST.address">
              {{ DString.formatAddress(customer) }}
            </td>
            <td class="text-right">
              <div class="flex justify-between gap-1 items-center">
                <div>
                  <VueButton
                    v-if="permissionIdMap[PermissionId.CUSTOMER_PAY_DEBT] && customer.debt != 0"
                    size="small"
                    @click="modalCustomerPayDebt?.openModal(customer)">
                    Trả nợ
                  </VueButton>
                </div>
                <div class="ml-2">
                  {{ formatMoney(customer.debt) }}
                </div>
              </div>
            </td>
            <td v-if="settingStore.SCREEN_CUSTOMER_LIST.isActive" class="text-center">
              <a-tag v-if="customer.isActive" color="success">
                <template #icon>
                  <CheckCircleOutlined />
                </template>
                Active
              </a-tag>
              <a-tag v-else color="warning">
                <template #icon>
                  <MinusCircleOutlined />
                </template>
                Inactive
              </a-tag>
            </td>
            <td
              v-if="
                permissionIdMap[PermissionId.CUSTOMER_UPDATE] &&
                settingStore.SCREEN_CUSTOMER_LIST.action
              "
              class="text-center">
              <a
                style="color: #eca52b"
                class="text-xl"
                @click="modalCustomerUpsert?.openModal(customer)">
                <FormOutlined />
              </a>
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
