<script setup lang="ts">
import { ApartmentOutlined } from '@ant-design/icons-vue'
import { onBeforeMount, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VueTag from '../../../common/VueTag.vue'
import { IconFileSearch, IconSetting } from '../../../common/icon'
import { IconEditSquare } from '../../../common/icon-google'
import { InputText, VueSelect } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DistributorService, type Distributor } from '../../../modules/distributor'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { DString } from '../../../utils'
import ModalDistributorPayDebt from '../ModalDistributorPayDebt.vue'
import ModalDistributorDetail from '../detail/ModalDistributorDetail.vue'
import ModalDistributorUpsert from '../upsert/ModalDistributorUpsert.vue'
import ModalDistributorListSettingScreen from './ModalDistributorListSettingScreen.vue'

const modalDistributorUpsert = ref<InstanceType<typeof ModalDistributorUpsert>>()
const modalDistributorDetail = ref<InstanceType<typeof ModalDistributorDetail>>()
const modalDistributorPayDebt = ref<InstanceType<typeof ModalDistributorPayDebt>>()
const modalDistributorListSettingScreen =
  ref<InstanceType<typeof ModalDistributorListSettingScreen>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

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
    const response = await DistributorService.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        isActive: isActive.value !== '' ? isActive.value : undefined,
        $OR: searchText.value
          ? [{ fullName: { LIKE: searchText.value } }, { phone: { LIKE: searchText.value } }]
          : undefined,
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
    total.value = response.meta.total
  } catch (error) {
    console.log('🚀 ~ file: DistributorList.vue:65 ~ startFetchData ~ error:', error)
  }
}

onBeforeMount(async () => {
  dataLoading.value = true
  await startFetchData()
  dataLoading.value = false
})

const startSearch = async () => {
  page.value = 1
  await startFetchData()
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

const handleModalDistributorUpsertSuccess = async () => {
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
    @success="handleModalDistributorUpsertSuccess" />
  <ModalDistributorDetail ref="modalDistributorDetail" @update_distributor="updateDistributor" />
  <ModalDistributorPayDebt
    ref="modalDistributorPayDebt"
    @success="handleModalDistributorPayDebtSuccess" />
  <ModalDistributorListSettingScreen ref="modalDistributorListSettingScreen" />

  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block">
        <ApartmentOutlined />
        Danh sách nhà cung cấp
      </div>
      <VueButton
        v-if="permissionIdMap[PermissionId.DISTRIBUTOR_CREATE]"
        color="blue"
        icon="plus"
        @click="modalDistributorUpsert?.openModal()">
        Thêm mới
      </VueButton>
    </div>
    <div class="page-header-setting">
      <a-dropdown v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]" trigger="click">
        <span>
          <IconSetting />
        </span>
        <template #overlay>
          <a-menu @click="handleMenuSettingClick">
            <a-menu-item key="screen-setting">Cài đặt hiển thị</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
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
            <th>Tên NCC</th>
            <th v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.phone">SĐT</th>
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
        <tbody>
          <tr v-if="distributorList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr
            v-for="(distributor, index) in distributorList"
            :key="index"
            @dblclick="
              permissionIdMap[PermissionId.DISTRIBUTOR_UPDATE] &&
                modalDistributorUpsert?.openModal(distributor.id)
            ">
            <td style="border-right: none">
              <div class="font-medium text-justify">
                {{ distributor.fullName }}
                <a
                  v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.detail"
                  class="text-base"
                  @click="modalDistributorDetail?.openModal(distributor.id)">
                  <IconFileSearch />
                </a>
              </div>
              <div v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.address" class="text-xs text-justify">
                {{ DString.formatAddress(distributor) }}
              </div>
              <div
                v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.note && distributor.note"
                class="text-xs italic">
                {{ distributor.note }}
              </div>
            </td>
            <td
              v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.phone"
              style="white-space: nowrap; border-left: none; border-right: none">
              <a :href="'tel:' + distributor.phone">
                {{ DString.formatPhone(distributor.phone || '') }}
              </a>
            </td>
            <td class="text-right" style="border-left: none">
              <div style="white-space: nowrap">{{ formatMoney(distributor.debt) }}</div>
              <div
                v-if="
                  permissionIdMap[PermissionId.DISTRIBUTOR_PAYMENT_PAY_DEBT] &&
                  distributor.debt != 0
                "
                class="flex justify-end">
                <VueButton
                  size="small"
                  @click="modalDistributorPayDebt?.openModal(distributor.id!, distributor.debt)">
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
              Mã NCC &nbsp;
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
              Họ Tên&nbsp;
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
            <th v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.phone">SĐT</th>
            <th v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.address">Địa Chỉ</th>
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
            <th v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.isActive">Trạng thái</th>
            <th
              v-if="
                settingStore.SCREEN_DISTRIBUTOR_LIST.action &&
                permissionIdMap[PermissionId.DISTRIBUTOR_UPDATE]
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
          <tr v-if="distributorList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(distributor, index) in distributorList" :key="index">
            <td class="text-center">CC{{ distributor.id }}</td>
            <td>
              <div>
                {{ distributor.fullName }}
                <a
                  v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.detail"
                  class="ml-1"
                  @click="modalDistributorDetail?.openModal(distributor.id)">
                  <IconFileSearch />
                </a>
              </div>
              <div
                v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.note && distributor.note"
                class="text-xs italic">
                {{ distributor.note }}
              </div>
            </td>
            <td v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.phone" class="text-center">
              {{ DString.formatPhone(distributor.phone) }}
            </td>
            <td v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.address">
              {{ DString.formatAddress(distributor) }}
            </td>
            <td class="text-right">
              <div class="flex justify-between">
                <div>
                  <VueButton
                    v-if="
                      permissionIdMap[PermissionId.DISTRIBUTOR_PAYMENT_PAY_DEBT] &&
                      distributor.debt != 0
                    "
                    size="small"
                    @click="modalDistributorPayDebt?.openModal(distributor.id, distributor.debt)">
                    Trả nợ
                  </VueButton>
                </div>
                <div class="ml-2">
                  {{ formatMoney(distributor.debt) }}
                </div>
              </div>
            </td>
            <td v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.isActive" class="text-center">
              <div>
                <VueTag v-if="distributor.isActive" icon="check" color="green">Active</VueTag>
                <VueTag v-else icon="minus" color="orange">Inactive</VueTag>
              </div>
            </td>
            <td
              v-if="
                settingStore.SCREEN_DISTRIBUTOR_LIST.action &&
                permissionIdMap[PermissionId.DISTRIBUTOR_UPDATE]
              "
              class="text-center">
              <a
                style="color: #eca52b"
                class="text-xl"
                @click="modalDistributorUpsert?.openModal(distributor.id)">
                <IconEditSquare />
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
