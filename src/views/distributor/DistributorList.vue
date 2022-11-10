<script setup lang="ts">
import { DistributorDebt, DistributorService, type Distributor } from '@/modules/distributor'
import { useOrganizationStore } from '@/store/organization.store'
import { convertViToEn, formatNumber } from '@/utils'
import { ApartmentOutlined, FileSearchOutlined, FormOutlined, PlusOutlined, SettingOutlined, MinusCircleOutlined, CheckCircleOutlined } from '@ant-design/icons-vue'
import { onBeforeMount, ref } from 'vue'
import ModalDistributorListSettingScreen from './components/ModalDistributorListSettingScreen.vue'
import ModalDistributorPayDebt from './components/ModalDistributorPayDebt.vue'
import ModalDistributorUpsert from './components/ModalDistributorUpsert.vue'
import ModalDistributorDetails from './details/ModalDistributorDetails.vue'

const modalDistributorUpsert = ref<InstanceType<typeof ModalDistributorUpsert>>()
const modalDistributorDetails = ref<InstanceType<typeof ModalDistributorDetails>>()
const modalDistributorPayDebt = ref<InstanceType<typeof ModalDistributorPayDebt>>()
const modalDistributorListSettingScreen = ref<InstanceType<typeof ModalDistributorListSettingScreen>>()

const organizationStore = useOrganizationStore()
const distributorList = ref<Distributor[]>([])

const loadingComponent = ref(false)

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const searchText = ref('')
const sortColumn = ref<'full_name_en' | 'debt' | 'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')
const isActive = ref<'true' | 'false' | ''>('true')

const startFetchData = async () => {
  loadingComponent.value = true
  const isPhoneText = /^\d+$/.test(searchText.value)
  const response = await DistributorService.pagination({
    page: page.value,
    limit: limit.value,
    filter: {
      is_active: isActive.value ? isActive.value : undefined,
      phone: isPhoneText && searchText.value ? searchText.value : undefined,
      full_name_en: (!isPhoneText && searchText.value) ? convertViToEn(searchText.value) : undefined,
    },
    sort: (sortColumn.value !== '') && (sortValue.value !== '') ? { [sortColumn.value]: sortValue.value } : undefined,
  })

  distributorList.value = response.data
  total.value = response.total
  loadingComponent.value = false
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

const changeSort = (column: 'full_name_en' | 'debt' | 'id') => {
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
  startSearch()
}

const changePagination = async (options: { page?: number, limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit
  await startFetchData()
}

const updateDistributor = async (data: Distributor) => {
  const findIndex = distributorList.value.findIndex((i) => i.id === data.id)
  if (findIndex !== -1) {
    distributorList.value[findIndex] = data
  }
}

const handleModalDistributorUpsertSuccess = async (data: Distributor, type: 'CREATE' | 'UPDATE') => {
  if (type === 'CREATE') {
    distributorList.value.unshift(data)
  }
  else if (type === 'UPDATE') updateDistributor(data)
}

const handleModalDistributorPayDebtSuccess = async (data: {
  distributor: Distributor,
  distributorDebt: DistributorDebt
}) => {
  updateDistributor(data.distributor)
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalDistributorListSettingScreen.value?.openModal()
  }
}
</script>

<template>
  <ModalDistributorUpsert ref="modalDistributorUpsert" @success="handleModalDistributorUpsertSuccess" />
  <ModalDistributorDetails ref="modalDistributorDetails" @update_distributor="updateDistributor" />
  <ModalDistributorPayDebt ref="modalDistributorPayDebt" @success="handleModalDistributorPayDebtSuccess" />
  <ModalDistributorListSettingScreen ref="modalDistributorListSettingScreen" />

  <div class="mx-4 mt-4">
    <div class="flex justify-between items-center">
      <div class="font-medium" style="font-size: 1.3rem;">
        <ApartmentOutlined style="margin-right: 1rem" />Danh sách nhà cung cấp
        <a-button type="primary" @click="modalDistributorUpsert?.openModal()" class="ml-4">
          <template #icon>
            <PlusOutlined />
          </template>
          Thêm nhà cung cấp
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
          class="w-full" placeholder="Tìm kiếm theo tên hoặc số điện thoại. Ấn Enter để tìm kiếm" />
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

    <div class="table-wrapper mt-4 w-full">
      <table class="table">
        <thead>
          <tr>
            <th class="cursor-pointer" @click="changeSort('id')">
              Mã NCC &nbsp;
              <font-awesome-icon v-if="sortColumn !== 'id'" :icon="['fas', 'sort']" style="opacity: 0.4;" />
              <font-awesome-icon v-if="sortColumn === 'id' && sortValue === 'ASC'" :icon="['fas', 'sort-up']" />
              <font-awesome-icon v-if="sortColumn === 'id' && sortValue === 'DESC'" :icon="['fas', 'sort-down']" />
            </th>
            <th class="cursor-pointer" @click="changeSort('full_name_en')">
              Họ Tên&nbsp;
              <font-awesome-icon v-if="sortColumn !== 'full_name_en'" :icon="['fas', 'sort']" style="opacity: 0.4;" />
              <font-awesome-icon v-if="sortColumn === 'full_name_en' && sortValue === 'ASC'" :icon="['fas', 'sort-up']" />
              <font-awesome-icon v-if="sortColumn === 'full_name_en' && sortValue === 'DESC'" :icon="['fas', 'sort-down']" />
            </th>
            <th v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.table.phone">SĐT</th>
            <th v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.table.address">Địa Chỉ</th>
            <th class="cursor-pointer" @click="changeSort('debt')">
              Nợ &nbsp;
              <font-awesome-icon v-if="sortColumn !== 'debt'" :icon="['fas', 'sort']" style="opacity: 0.4;" />
              <font-awesome-icon v-if="sortColumn === 'debt' && sortValue === 'ASC'" :icon="['fas', 'sort-up']" />
              <font-awesome-icon v-if="sortColumn === 'debt' && sortValue === 'DESC'" :icon="['fas', 'sort-down']" />
            </th>
            <th v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.table.note">Ghi chú</th>
            <th v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.table.isActive">Trạng thái</th>
            <th v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.table.action">Sửa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="distributorList.length === 0">
            <td colspan="20" class="text-center"> No data</td>
          </tr>
          <tr v-for="(distributor, index) in distributorList" :key="index">
            <td class="text-center">DT{{ distributor.id }}</td>
            <td>
              <div class="flex justify-between">
                <div> {{ distributor.fullNameVi }}</div>
                <a v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.table.detail" class="text-xl"
                  @click="modalDistributorDetails?.openModal(distributor)">
                  <FileSearchOutlined />
                </a>
              </div>
            </td>
            <td v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.table.phone" class="text-center">
              {{ distributor.phone }}
            </td>
            <td v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.table.address">{{ distributor.addressProvince }} - {{
              distributor.addressDistrict }} - {{ distributor.addressWard }}
            </td>
            <td class="text-right">
              <div class="flex justify-between">
                <div>
                  <a-button v-if="distributor.debt != 0" type="default"
                    @click="modalDistributorPayDebt?.openModal(distributor.id, distributor.debt)" size="small">
                    Trả nợ
                  </a-button>
                </div>
                <div>
                  {{ formatNumber(distributor.debt) }}
                </div>
              </div>
            </td>
            <td v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.table.note" class="text-center">
              {{ distributor.note }}
            </td>
            <td v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.table.isActive" class="text-center">
              <a-tag v-if="distributor.isActive" color="success">
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
            <td v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.table.action" class="text-center">
              <a style="color: #eca52b;" class="text-xl" @click="modalDistributorUpsert?.openModal(distributor)">
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
