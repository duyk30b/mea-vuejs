<script setup lang="ts">
import { CustomerDebt, CustomerService, type Customer } from '@/modules/customer'
import { useOrganizationStore } from '@/store/organization.store'
import { convertViToEn, formatNumber, timeToText } from '@/utils'
import {
  CheckCircleOutlined, ContactsOutlined, FileSearchOutlined,
  FormOutlined, MinusCircleOutlined, PlusOutlined, SettingOutlined,
} from '@ant-design/icons-vue'
import { onBeforeMount, ref } from 'vue'
import ModalCustomerListSettingScreen from './components/ModalCustomerListSettingScreen.vue'
import ModalCustomerPayDebt from './components/ModalCustomerPayDebt.vue'
import ModalCustomerUpsert from './components/ModalCustomerUpsert.vue'
import ModalCustomerDetails from './details/ModalCustomerDetails.vue'

const modalCustomerUpsert = ref<InstanceType<typeof ModalCustomerUpsert>>()
const modalCustomerPayDebt = ref<InstanceType<typeof ModalCustomerPayDebt>>()
const modalCustomerListSettingScreen = ref<InstanceType<typeof ModalCustomerListSettingScreen>>()
const modalCustomerDetails = ref<InstanceType<typeof ModalCustomerDetails>>()

const organizationStore = useOrganizationStore()
const customerList = ref<Customer[]>([])

const loadingComponent = ref(false)

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const searchText = ref('')
const sortColumn = ref<'full_name_en' | 'debt' | 'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')
const isActive = ref<'true' | 'false' | ''>('true')

const startFetchData = async () => {
  try {
    loadingComponent.value = true
    const isPhoneText = /^\d+$/.test(searchText.value)
    let sort
    if (sortColumn.value !== '' && sortValue.value !== '') {
      sort = { [sortColumn.value]: sortValue.value }
    }

    const response = await CustomerService.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        is_active: isActive.value ? isActive.value : undefined,
        phone: isPhoneText && searchText.value ? searchText.value : undefined,
        full_name_en: (!isPhoneText && searchText.value) ? convertViToEn(searchText.value) : undefined,
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
  await startFetchData()
})

const startSearch = async () => {
  page.value = 1
  await startFetchData()
}

const handleSelectStatus = async (value: 'true' | 'false' | '') => {
  await startSearch()
}

const changeSort = async (column: 'full_name_en' | 'debt' | 'id') => {
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
  if (options.limit) limit.value = options.limit
  await startFetchData()
}

const updateCustomer = async (data: Customer) => {
  const findIndex = customerList.value.findIndex((i) => i.id === data.id)
  if (findIndex !== -1) {
    customerList.value[findIndex] = data
  }
}

const handleModalCustomerUpsertSuccess = async (data: Customer, type: 'CREATE' | 'UPDATE') => {
  if (type === 'CREATE') {
    customerList.value.unshift(data)
  }
  else if (type === 'UPDATE') updateCustomer(data)
}

const handleModalDistributorPayDebtSuccess = async (data: {
  customer: Customer,
  customerDebt: CustomerDebt
}) => {
  updateCustomer(data.customer)
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalCustomerListSettingScreen.value?.openModal()
  }
}
</script>

<template>
  <ModalCustomerUpsert ref="modalCustomerUpsert" @success="handleModalCustomerUpsertSuccess" />
  <ModalCustomerDetails ref="modalCustomerDetails" @update_customer="updateCustomer" />
  <ModalCustomerPayDebt ref="modalCustomerPayDebt" @success="handleModalDistributorPayDebtSuccess" />
  <ModalCustomerListSettingScreen ref="modalCustomerListSettingScreen" />

  <div class="mx-4 mt-4">
    <div class="flex justify-between items-center">
      <div class="font-medium" style="font-size: 1.3rem;">
        <ContactsOutlined style="margin-right: 1rem" />Danh sách khách hàng
        <a-button type="primary" @click="modalCustomerUpsert?.openModal()" class="ml-4">
          <template #icon>
            <PlusOutlined />
          </template>
          Thêm khách hàng
        </a-button>
      </div>
      <div>
        <a-dropdown trigger="click">
          <span style="font-size: 1.1rem; cursor: pointer;">
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
  </div>

  <div class="mx-4 mt-4 p-4 bg-white">
    <div class="flex flex-wrap gap-4">
      <div style="width: 600px">
        <div>Tìm kiếm</div>
        <a-input-search v-model:value="searchText" allow-clear enter-button @search="(text: string) => startSearch()"
          placeholder="Tìm kiếm theo tên hoặc số điện thoại. Ấn Enter để tìm kiếm" class="w-full" />
      </div>

      <div style="flex-basis: 300px;">
        <div>Chọn trạng thái</div>
        <a-select v-model:value="isActive" allow-clear @change="handleSelectStatus" class="w-full" placeholder="Tất cả">
          <a-select-option value="">Tất cả</a-select-option>
          <a-select-option value="true">Active</a-select-option>
          <a-select-option value="false">Inactive</a-select-option>
        </a-select>
      </div>
    </div>

    <div class="w-full table-wrapper mt-4">
      <table class="table">
        <thead>
          <tr>
            <th class="cursor-pointer" @click="changeSort('id')">
              Mã KH &nbsp;
              <font-awesome-icon v-if="sortColumn !== 'id'" :icon="['fas', 'sort']" style="opacity: 0.4;" />
              <font-awesome-icon v-if="sortColumn === 'id' && sortValue === 'ASC'" :icon="['fas', 'sort-up']" />
              <font-awesome-icon v-if="sortColumn === 'id' && sortValue === 'DESC'" :icon="['fas', 'sort-down']" />
            </th>
            <th class="cursor-pointer" @click="changeSort('full_name_en')">
              Họ Tên &nbsp;
              <font-awesome-icon v-if="sortColumn !== 'full_name_en'" :icon="['fas', 'sort']" style="opacity: 0.4;" />
              <font-awesome-icon v-if="sortColumn === 'full_name_en' && sortValue === 'ASC'" :icon="['fas', 'sort-up']" />
              <font-awesome-icon v-if="sortColumn === 'full_name_en' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']" />
            </th>
            <th v-if="organizationStore.SCREEN_CUSTOMER_LIST.table.phone">SĐT</th>
            <th v-if="organizationStore.SCREEN_CUSTOMER_LIST.table.gender">Giới tính</th>
            <th v-if="organizationStore.SCREEN_CUSTOMER_LIST.table.birthday">Ngày sinh</th>
            <th v-if="organizationStore.SCREEN_CUSTOMER_LIST.table.address">Địa Chỉ</th>
            <th class="cursor-pointer" @click="changeSort('debt')">
              Nợ &nbsp;
              <font-awesome-icon v-if="sortColumn !== 'debt'" :icon="['fas', 'sort']" style="opacity: 0.4;" />
              <font-awesome-icon v-if="sortColumn === 'debt' && sortValue === 'ASC'" :icon="['fas', 'sort-up']" />
              <font-awesome-icon v-if="sortColumn === 'debt' && sortValue === 'DESC'" :icon="['fas', 'sort-down']" />
            </th>
            <th v-if="organizationStore.SCREEN_CUSTOMER_LIST.table.note">Ghi chú</th>
            <th v-if="organizationStore.SCREEN_CUSTOMER_LIST.table.isActive">Trạng thái</th>
            <th v-if="organizationStore.SCREEN_CUSTOMER_LIST.table.action">Sửa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="customerList.length === 0">
            <td colspan="20" class="text-center"> No data</td>
          </tr>
          <tr v-for="(customer, index) in customerList" :key="index">
            <td class="text-center">CM{{ customer.id }}</td>
            <td>
              <div class="flex justify-between">
                <div>{{ customer.fullNameVi }}</div>
                <a v-if="organizationStore.SCREEN_CUSTOMER_LIST.table.detail" class="text-xl"
                  @click="modalCustomerDetails?.openModal(customer)">
                  <FileSearchOutlined />
                </a>
              </div>
            </td>
            <td v-if="organizationStore.SCREEN_CUSTOMER_LIST.table.phone" class="text-center">
              <a :href="'tel:' + customer.phone">{{ customer.phone }}</a>
            </td>
            <td v-if="organizationStore.SCREEN_CUSTOMER_LIST.table.gender" class="text-center">
              <span v-if="customer.gender != null">{{ customer.gender ? 'Nam' : 'Nữ' }}</span>
            </td>
            <td v-if="organizationStore.SCREEN_CUSTOMER_LIST.table.birthday" class="text-center">
              {{ timeToText(customer.birthday, 'DD/MM/YYYY') }}
            </td>

            <td v-if="organizationStore.SCREEN_CUSTOMER_LIST.table.address">
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
                  {{ formatNumber(customer.debt) }}
                </div>
              </div>
            </td>
            <td v-if="organizationStore.SCREEN_CUSTOMER_LIST.table.note" class="text-center">
              {{ customer.note }}
            </td>
            <td v-if="organizationStore.SCREEN_CUSTOMER_LIST.table.isActive" class="text-center">
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
            <td v-if="organizationStore.SCREEN_CUSTOMER_LIST.table.action" class="text-center">
              <a style="color: #eca52b;" class="text-xl" @click="modalCustomerUpsert?.openModal(customer)">
                <FormOutlined />
              </a>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="mt-4 float-right mb-2">
        <a-pagination v-model:current="page" v-model:pageSize="limit" :total="total"
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })" />
      </div>
    </div>
  </div>
</template>
