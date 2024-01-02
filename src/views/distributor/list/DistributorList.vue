<script setup lang="ts">
import {
  ApartmentOutlined,
  CheckCircleOutlined,
  FileSearchOutlined,
  FormOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'
import { onBeforeMount, ref } from 'vue'
import { VueSelect } from '../../../common/vue-form'
import { useDistributorStore, type Distributor } from '../../../modules/distributor'
import { useOrganizationStore } from '../../../store/organization.store'
import { formatPhone } from '../../../utils'
import ModalDistributorPayDebt from '../ModalDistributorPayDebt.vue'
import ModalDistributorDetail from '../detail/ModalDistributorDetail.vue'
import ModalDistributorUpsert from '../upsert/ModalDistributorUpsert.vue'
import ModalDistributorListSettingScreen from './ModalDistributorListSettingScreen.vue'

const modalDistributorUpsert = ref<InstanceType<typeof ModalDistributorUpsert>>()
const modalDistributorDetail = ref<InstanceType<typeof ModalDistributorDetail>>()
const modalDistributorPayDebt = ref<InstanceType<typeof ModalDistributorPayDebt>>()
const modalDistributorListSettingScreen =
  ref<InstanceType<typeof ModalDistributorListSettingScreen>>()

const distributorStore = useDistributorStore()
const organizationStore = useOrganizationStore()
const { formatMoney, isMobile } = organizationStore

const distributorList = ref<Distributor[]>([])

const dataLoading = ref(false)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('DISTRIBUTOR_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const searchText = ref('')
const isActive = ref<1 | 0 | ''>(1)

const sortColumn = ref<'fullName' | 'debt' | 'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const startFetchData = async () => {
  try {
    // dataLoading.value = true
    const response = await distributorStore.pagination({
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

    distributorList.value = response.data
    total.value = response.total

    dataLoading.value = false
  } catch (error) {
    console.log('🚀 ~ file: DistributorList.vue:65 ~ startFetchData ~ error:', error)
  }
}

onBeforeMount(async () => {
  try {
    dataLoading.value = true
    await distributorStore.refreshDB()
  } catch (error) {
    console.log('🚀 ~ file: CustomerList.vue:78 ~ onBeforeMount ~ error:', error)
  } finally {
    dataLoading.value = false
  }
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

const handleSelectStatus = async (value: 1 | 0 | '') => {
  isActive.value = value
  await startSearch()
}

const changeSort = (column: 'fullName' | 'debt' | 'id') => {
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

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('DISTRIBUTOR_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

const updateDistributor = async (data: Distributor) => {
  await startFetchData()
}

const handleModalDistributorUpsertSuccess = async (
  data: Distributor,
  type: 'CREATE' | 'UPDATE' | 'DELETE'
) => {
  await startFetchData()
}

const handleModalDistributorPayDebtSuccess = async (data: { distributor: Distributor }) => {
  await startFetchData()
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalDistributorListSettingScreen.value?.openModal()
  }
}
</script>

<template>
  <ModalDistributorUpsert
    ref="modalDistributorUpsert"
    @success="handleModalDistributorUpsertSuccess"
  />
  <ModalDistributorDetail ref="modalDistributorDetail" @update_distributor="updateDistributor" />
  <ModalDistributorPayDebt
    ref="modalDistributorPayDebt"
    @success="handleModalDistributorPayDebtSuccess"
  />
  <ModalDistributorListSettingScreen ref="modalDistributorListSettingScreen" />

  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block"><ApartmentOutlined /> Danh sách nhà cung cấp</div>
      <a-button type="primary" @click="modalDistributorUpsert?.openModal()">
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
      <div style="flex: 2; flex-basis: 500px">
        <div>Tìm kiếm</div>
        <a-input-group compact class="w-full">
          <a-input
            :value="searchText"
            allow-clear
            style="width: calc(100% - 100px)"
            @input="handleInputSearchText"
          />
          <a-button type="primary" class="w-[100px]"> Tìm kiếm </a-button>
        </a-input-group>
      </div>

      <div style="flex: 1; flex-basis: 300px">
        <div>Chọn trạng thái</div>
        <div>
          <VueSelect
            :value="isActive"
            :options="[
              { text: 'Tất cả', value: '' },
              { text: 'Active', value: 1 },
              { text: 'Inactive', value: 0 },
            ]"
            @update:value="handleSelectStatus"
          />
        </div>
      </div>
    </div>

    <div v-if="isMobile" class="page-main-list">
      <table class="table-mobile">
        <thead>
          <tr>
            <th>Tên NCC</th>
            <th v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.phone">SĐT</th>
            <th class="cursor-pointer whitespace-nowrap" @click="changeSort('debt')">
              Nợ &nbsp;
              <font-awesome-icon
                v-if="sortColumn !== 'debt'"
                :icon="['fas', 'sort']"
                style="opacity: 0.4"
              />
              <font-awesome-icon
                v-if="sortColumn === 'debt' && sortValue === 'ASC'"
                :icon="['fas', 'sort-up']"
              />
              <font-awesome-icon
                v-if="sortColumn === 'debt' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="distributorList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr
            v-for="(distributor, index) in distributorList"
            :key="index"
            @dblclick="modalDistributorUpsert?.openModal(distributor)"
          >
            <td style="border-right: none">
              <div class="font-medium text-justify">
                {{ distributor.fullName }}
                <a
                  v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.detail"
                  class="text-base"
                  @click="modalDistributorDetail?.openModal(distributor)"
                >
                  <FileSearchOutlined />
                </a>
              </div>
              <div
                v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.address"
                class="text-xs text-justify"
              >
                {{ distributor.addressProvince }} - {{ distributor.addressDistrict }} -
                {{ distributor.addressWard }}
              </div>
              <div v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.note" class="text-center">
                {{ distributor.note }}
              </div>
            </td>
            <td
              v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.phone"
              style="white-space: nowrap; border-left: none; border-right: none"
            >
              <a :href="'tel:' + distributor.phone">{{ formatPhone(distributor.phone || '') }}</a>
            </td>
            <td class="text-right" style="border-left: none">
              <div>{{ formatMoney(distributor.debt) }}</div>
              <div v-if="distributor.debt != 0">
                <a-button
                  type="default"
                  size="small"
                  @click="modalDistributorPayDebt?.openModal(distributor.id!, distributor.debt)"
                >
                  Trả nợ
                </a-button>
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
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })"
        />
      </div>
    </div>

    <div v-else class="page-main-table table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th class="cursor-pointer" @click="changeSort('id')">
              Mã NCC &nbsp;
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
            <th class="cursor-pointer" @click="changeSort('fullName')">
              Họ Tên&nbsp;
              <font-awesome-icon
                v-if="sortColumn !== 'fullName'"
                :icon="['fas', 'sort']"
                style="opacity: 0.4"
              />
              <font-awesome-icon
                v-if="sortColumn === 'fullName' && sortValue === 'ASC'"
                :icon="['fas', 'sort-up']"
              />
              <font-awesome-icon
                v-if="sortColumn === 'fullName' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']"
              />
            </th>
            <th v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.phone">SĐT</th>
            <th v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.address">Địa Chỉ</th>
            <th class="cursor-pointer" @click="changeSort('debt')">
              Nợ &nbsp;
              <font-awesome-icon
                v-if="sortColumn !== 'debt'"
                :icon="['fas', 'sort']"
                style="opacity: 0.4"
              />
              <font-awesome-icon
                v-if="sortColumn === 'debt' && sortValue === 'ASC'"
                :icon="['fas', 'sort-up']"
              />
              <font-awesome-icon
                v-if="sortColumn === 'debt' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']"
              />
            </th>
            <th v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.isActive">Trạng thái</th>
            <th v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.action">Sửa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="distributorList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(distributor, index) in distributorList" :key="index">
            <td class="text-center">DT{{ distributor.id }}</td>
            <td>
              <div>
                {{ distributor.fullName }}
                <a
                  v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.detail"
                  class="ml-1"
                  @click="modalDistributorDetail?.openModal(distributor)"
                >
                  <FileSearchOutlined />
                </a>
              </div>
              <div v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.note" style="font-size: 0.8rem">
                {{ distributor.note }}
              </div>
            </td>
            <td v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.phone" class="text-center">
              {{ distributor.phone }}
            </td>
            <td v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.address">
              {{ distributor.addressProvince }} - {{ distributor.addressDistrict }} -
              {{ distributor.addressWard }}
            </td>
            <td class="text-right">
              <div class="flex justify-between">
                <div>
                  <a-button
                    v-if="distributor.debt != 0"
                    type="default"
                    size="small"
                    @click="modalDistributorPayDebt?.openModal(distributor.id, distributor.debt)"
                  >
                    Trả nợ
                  </a-button>
                </div>
                <div>
                  {{ formatMoney(distributor.debt) }}
                </div>
              </div>
            </td>
            <td v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.isActive" class="text-center">
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
            <td v-if="organizationStore.SCREEN_DISTRIBUTOR_LIST.action" class="text-center">
              <a
                style="color: #eca52b"
                class="text-xl"
                @click="modalDistributorUpsert?.openModal(distributor)"
              >
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
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })"
        />
      </div>
    </div>
  </div>
</template>
