<script setup lang="ts">
import { CustomerPayment, useCustomerStore, type Customer } from '@/modules/customer'
import { useOrganizationStore } from '@/store/organization.store'
import { formatPhone, timeToText } from '@/utils'
import {
  CheckCircleOutlined, ContactsOutlined, FileSearchOutlined,
  FormOutlined, MinusCircleOutlined, PlusOutlined, SettingOutlined,
} from '@ant-design/icons-vue'
import { onBeforeMount, ref } from 'vue'
import ModalCustomerPayDebt from '../ModalCustomerPayDebt.vue'
import ModalCustomerDetail from '../detail/ModalCustomerDetail.vue'
import ModalCustomerUpsert from '../upsert/ModalCustomerUpsert.vue'
import ModalCustomerListSettingScreen from './ModalCustomerListSettingScreen.vue'

const modalCustomerUpsert = ref<InstanceType<typeof ModalCustomerUpsert>>()
const modalCustomerPayDebt = ref<InstanceType<typeof ModalCustomerPayDebt>>()
const modalCustomerListSettingScreen = ref<InstanceType<typeof ModalCustomerListSettingScreen>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()

const customerStore = useCustomerStore()
const organizationStore = useOrganizationStore()
const { formatMoney, isMobile } = organizationStore

const customerList = ref<Customer[]>([])

const loadingComponent = ref(false)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('CUSTOMER_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const searchText = ref('')
const isActive = ref<'true' | 'false' | ''>('true')

const sortColumn = ref<'full_name' | 'debt' | 'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const startFetchData = async () => {
  try {
    loadingComponent.value = true
    let sort: any
    if (sortColumn.value !== '' && sortValue.value !== '') {
      sort = { [sortColumn.value]: sortValue.value }
    }

    const response = customerStore.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        is_active: isActive.value ? isActive.value : undefined,
        search_text: searchText.value ? searchText.value : undefined,
      },
      sort: sort || { id: 'DESC' },
    })

    customerList.value = response.data
    total.value = response.total

    loadingComponent.value = false
  } catch (error) {
    console.log('🚀 ~ file: CustomerList.vue:59 ~ startFetchData ~ error:', error)
  }
}

onBeforeMount(async () => {
  await customerStore.fetchAll()
  await startFetchData()
})

const startSearch = async () => {
  page.value = 1
  await startFetchData()
}

const handleInputSearchText = (event: any) => {
  searchText.value = event.target.value
  startSearch()
}

const handleSelectStatus = async (value: 'true' | 'false' | '') => {
  await startSearch()
}

const changeSort = async (column: 'full_name' | 'debt' | 'id') => {
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
    localStorage.setItem('CUSTOMER_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

const updateCustomer = async (data: Customer) => {
  await startFetchData()
}

const handleModalCustomerUpsertSuccess = async (data: Customer, type: 'CREATE' | 'UPDATE') => {
  await startFetchData()
}

const handleModalDistributorPayDebtSuccess = async (data: {
  customer: Customer,
}) => {
  await startFetchData()
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalCustomerListSettingScreen.value?.openModal()
  }
}
</script>

<template>
  <ModalCustomerUpsert ref="modalCustomerUpsert" @success="handleModalCustomerUpsertSuccess" />
  <ModalCustomerDetail ref="modalCustomerDetail" @update_customer="updateCustomer" />
  <ModalCustomerPayDebt ref="modalCustomerPayDebt" @success="handleModalDistributorPayDebtSuccess" />
  <ModalCustomerListSettingScreen ref="modalCustomerListSettingScreen" />

  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block">
        <ContactsOutlined /> Danh sách khách hàng
      </div>
      <a-button type="primary" @click="modalCustomerUpsert?.openModal()">
        <template #icon>
          <PlusOutlined />
        </template>
        Thêm mới
      </a-button>
    </div>
    <div class="page-header-setting">
      <a-dropdown trigger="click">
        <span>
          <SettingOutlined />
        </span>
        <template #overlay>
          <a-menu @click="handleMenuSettingClick">
            <a-menu-item key="screen-setting"> Cài đặt hiển thị </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>

  <div class="page-main">
    <div class="page-main-options">
      <div style="flex: 2; flex-basis: 500px;">
        <div>Tìm kiếm</div>
        <a-input-group compact class="w-full">
          <a-input :value="searchText" @input="handleInputSearchText" allow-clear style="width: calc(100% - 100px)" />
          <a-button type="primary" class="w-[100px]">Tìm kiếm</a-button>
        </a-input-group>
      </div>

      <div style="flex: 1; flex-basis: 300px;">
        <div>Chọn trạng thái</div>
        <a-select v-model:value="isActive" allow-clear @change="handleSelectStatus" class="w-full" placeholder="Tất cả">
          <a-select-option value="">Tất cả</a-select-option>
          <a-select-option value="true">Active</a-select-option>
          <a-select-option value="false">Inactive</a-select-option>
        </a-select>
      </div>
    </div>

    <div v-if="isMobile" class="page-main-list">
      <table class="table-mobile">
        <thead>
          <tr>
            <th>Tên KH</th>
            <th v-if="organizationStore.SCREEN_CUSTOMER_LIST.phone">SĐT</th>
            <th class="cursor-pointer whitespace-nowrap" @click="changeSort('debt')"> Nợ &nbsp;
              <font-awesome-icon v-if="sortColumn !== 'debt'" :icon="['fas', 'sort']" style="opacity: 0.4;" />
              <font-awesome-icon v-if="sortColumn === 'debt' && sortValue === 'ASC'" :icon="['fas', 'sort-up']" />
              <font-awesome-icon v-if="sortColumn === 'debt' && sortValue === 'DESC'" :icon="['fas', 'sort-down']" />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="customerList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(customer, index) in customerList" :key="index" @dblclick="modalCustomerUpsert?.openModal(customer)">
            <td style="border-right: none;">
              <div class="font-medium text-justify">
                {{ customer.fullName }}
                <a v-if="organizationStore.SCREEN_CUSTOMER_LIST.detail" class="text-base"
                  @click="modalCustomerDetail?.openModal(customer)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div class="text-xs text-justify" v-if="organizationStore.SCREEN_CUSTOMER_LIST.address">
                {{ customer.addressProvince }} - {{ customer.addressDistrict }} - {{ customer.addressWard }}
              </div>
              <div class="flex gap-4 text-xs">
                <div v-if="organizationStore.SCREEN_CUSTOMER_LIST.birthday" class="text-center">
                  {{ timeToText(customer.birthday, 'DD/MM/YYYY') }}
                </div>
                <div v-if="organizationStore.SCREEN_CUSTOMER_LIST.gender" class="text-center">
                  <span v-if="customer.gender != null">{{ customer.gender ? 'Nam' : 'Nữ' }}</span>
                </div>
              </div>
              <div v-if="organizationStore.SCREEN_CUSTOMER_LIST.note" class="text-center">
                {{ customer.note }}
              </div>
            </td>
            <td v-if="organizationStore.SCREEN_CUSTOMER_LIST.phone"
              style="white-space: nowrap; border-left: none; border-right: none;">
              <a :href="'tel:' + customer.phone">{{ formatPhone(customer.phone || '') }}</a>
            </td>
            <td class="text-right" style="border-left: none;">
              <div> {{ formatMoney(customer.debt) }} </div>
              <div v-if="customer.debt != 0">
                <a-button type="default" @click="modalCustomerPayDebt?.openModal(customer.id!, customer.debt)"
                  size="small">
                  Trả nợ
                </a-button>
              </div>
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
            <th class="cursor-pointer" @click="changeSort('id')">
              Mã KH &nbsp;
              <font-awesome-icon v-if="sortColumn !== 'id'" :icon="['fas', 'sort']" style="opacity: 0.4;" />
              <font-awesome-icon v-if="sortColumn === 'id' && sortValue === 'ASC'" :icon="['fas', 'sort-up']" />
              <font-awesome-icon v-if="sortColumn === 'id' && sortValue === 'DESC'" :icon="['fas', 'sort-down']" />
            </th>
            <th class="cursor-pointer" @click="changeSort('full_name')">
              Họ Tên &nbsp;
              <font-awesome-icon v-if="sortColumn !== 'full_name'" :icon="['fas', 'sort']" style="opacity: 0.4;" />
              <font-awesome-icon v-if="sortColumn === 'full_name' && sortValue === 'ASC'" :icon="['fas', 'sort-up']" />
              <font-awesome-icon v-if="sortColumn === 'full_name' && sortValue === 'DESC'" :icon="['fas', 'sort-down']" />
            </th>
            <th v-if="organizationStore.SCREEN_CUSTOMER_LIST.phone">SĐT</th>
            <th v-if="organizationStore.SCREEN_CUSTOMER_LIST.gender">Giới tính</th>
            <th v-if="organizationStore.SCREEN_CUSTOMER_LIST.birthday">Ngày sinh</th>
            <th v-if="organizationStore.SCREEN_CUSTOMER_LIST.address">Địa Chỉ</th>
            <th class="cursor-pointer" @click="changeSort('debt')">
              Nợ &nbsp;
              <font-awesome-icon v-if="sortColumn !== 'debt'" :icon="['fas', 'sort']" style="opacity: 0.4;" />
              <font-awesome-icon v-if="sortColumn === 'debt' && sortValue === 'ASC'" :icon="['fas', 'sort-up']" />
              <font-awesome-icon v-if="sortColumn === 'debt' && sortValue === 'DESC'" :icon="['fas', 'sort-down']" />
            </th>
            <th v-if="organizationStore.SCREEN_CUSTOMER_LIST.isActive">Trạng thái</th>
            <th v-if="organizationStore.SCREEN_CUSTOMER_LIST.action">Sửa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="customerList.length === 0">
            <td colspan="20" class="text-center"> No data</td>
          </tr>
          <tr v-for="(customer, index) in customerList" :key="index">
            <td class="text-center">CM{{ customer.id }}</td>
            <td>
              <div>

                {{ customer.fullName }}
                <a v-if="organizationStore.SCREEN_CUSTOMER_LIST.detail" class="ml-1"
                  @click="modalCustomerDetail?.openModal(customer)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div v-if="organizationStore.SCREEN_CUSTOMER_LIST.note" class="text-center">
                {{ customer.note }}
              </div>
            </td>
            <td v-if="organizationStore.SCREEN_CUSTOMER_LIST.phone" class="text-center">
              <a :href="'tel:' + customer.phone">{{ customer.phone }}</a>
            </td>
            <td v-if="organizationStore.SCREEN_CUSTOMER_LIST.gender" class="text-center">
              <span v-if="customer.gender != null">{{ customer.gender ? 'Nam' : 'Nữ' }}</span>
            </td>
            <td v-if="organizationStore.SCREEN_CUSTOMER_LIST.birthday" class="text-center">
              {{ timeToText(customer.birthday, 'DD/MM/YYYY') }}
            </td>

            <td v-if="organizationStore.SCREEN_CUSTOMER_LIST.address">
              {{ customer.addressProvince }} - {{ customer.addressDistrict }} - {{ customer.addressWard }}
            </td>
            <td class="text-right">
              <div class="flex justify-between">
                <div>
                  <a-button v-if="customer.debt != 0" type="default"
                    @click="modalCustomerPayDebt?.openModal(customer.id!, customer.debt)" size="small">
                    Trả nợ
                  </a-button>
                </div>
                <div>
                  {{ formatMoney(customer.debt) }}
                </div>
              </div>
            </td>
            <td v-if="organizationStore.SCREEN_CUSTOMER_LIST.isActive" class="text-center">
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
            <td v-if="organizationStore.SCREEN_CUSTOMER_LIST.action" class="text-center">
              <a style="color: #eca52b;" class="text-xl" @click="modalCustomerUpsert?.openModal(customer)">
                <FormOutlined />
              </a>
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
