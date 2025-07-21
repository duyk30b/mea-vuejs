<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VuePagination from '../../../common/VuePagination.vue'
import VueTag from '../../../common/VueTag.vue'
import { IconContainer, IconFileSearch, IconSetting } from '../../../common/icon-antd'
import { IconSort, IconSortDown, IconSortUp } from '../../../common/icon-font-awesome'
import { IconEditSquare } from '../../../common/icon-google'
import VueDropdown from '../../../common/popover/VueDropdown.vue'
import { InputSelect, InputText, VueSelect } from '../../../common/vue-form'
import { MeService } from '../../../modules/_me/me.service'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Distributor, DistributorService } from '../../../modules/distributor'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { ESString } from '../../../utils'
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
const { userPermission } = MeService

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
  // await startFetchData()
  const index = distributorList.value.findIndex((i) => i.id === data.distributor.id)
  if (index !== -1) {
    distributorList.value[index] = Distributor.from(data.distributor)
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
    <div class="flex items-center gap-4">
      <div class="hidden md:flex items-center gap-2 font-medium text-xl">
        <IconContainer />
        Danh sách nhà cung cấp
      </div>
      <VueButton
        v-if="userPermission[PermissionId.DISTRIBUTOR_CREATE]"
        color="blue"
        icon="plus"
        @click="modalDistributorUpsert?.openModal()"
      >
        Thêm mới
      </VueButton>
    </div>
    <div class="mr-2 flex gap-8">
      <VueDropdown v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]">
        <template #trigger>
          <span style="font-size: 1.2rem; cursor: pointer">
            <IconSetting />
          </span>
        </template>
        <div class="vue-menu">
          <a @click="modalDistributorListSettingScreen?.openModal()">Cài đặt hiển thị</a>
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
            <th>Tên NCC</th>
            <th v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.phone">SĐT</th>
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
        <tbody>
          <tr v-if="distributorList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr
            v-for="(distributor, index) in distributorList"
            :key="index"
            @dblclick="
              userPermission[PermissionId.DISTRIBUTOR_UPDATE] &&
              modalDistributorUpsert?.openModal(distributor.id)
            "
          >
            <td style="border-right: none">
              <div class="font-medium text-justify">
                {{ distributor.fullName }}
                <a
                  v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.detail"
                  class="text-base"
                  @click="modalDistributorDetail?.openModal(distributor.id)"
                >
                  <IconFileSearch />
                </a>
              </div>
              <div v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.address" class="text-xs text-justify">
                {{ ESString.formatAddress(distributor) }}
              </div>
              <div
                v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.note && distributor.note"
                class="text-xs italic"
              >
                {{ distributor.note }}
              </div>
            </td>
            <td
              v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.phone"
              style="white-space: nowrap; border-left: none; border-right: none"
            >
              <a :href="'tel:' + distributor.phone">
                {{ ESString.formatPhone(distributor.phone || '') }}
              </a>
            </td>
            <td class="text-right" style="border-left: none">
              <div style="white-space: nowrap">{{ formatMoney(distributor.debt) }}</div>
              <div
                v-if="
                  userPermission[PermissionId.PAYMENT_DISTRIBUTOR_PAYMENT] && distributor.debt != 0
                "
                class="flex justify-end"
              >
                <VueButton size="small" @click="modalDistributorPayDebt?.openModal(distributor.id)">
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
            <th class="cursor-pointer" @click="changeSort('id')">
              <div class="flex items-center gap-1 justify-center">
                <span>Mã NCC</span>
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
            <th v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.phone">SĐT</th>
            <th v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.address">Địa Chỉ</th>
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
            <th v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.isActive">Trạng thái</th>
            <th
              v-if="
                settingStore.SCREEN_DISTRIBUTOR_LIST.action &&
                userPermission[PermissionId.DISTRIBUTOR_UPDATE]
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
                  @click="modalDistributorDetail?.openModal(distributor.id)"
                >
                  <IconFileSearch />
                </a>
              </div>
              <div
                v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.note && distributor.note"
                class="text-xs italic"
              >
                {{ distributor.note }}
              </div>
            </td>
            <td v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.phone" class="text-center">
              {{ ESString.formatPhone(distributor.phone) }}
            </td>
            <td v-if="settingStore.SCREEN_DISTRIBUTOR_LIST.address">
              {{ ESString.formatAddress(distributor) }}
            </td>
            <td class="text-right">
              <div v-if="distributor.debt > 0" class="flex justify-between gap-2">
                <div>
                  <VueButton
                    v-if="
                      userPermission[PermissionId.PAYMENT_DISTRIBUTOR_PAYMENT] &&
                      distributor.debt != 0
                    "
                    size="small"
                    @click="modalDistributorPayDebt?.openModal(distributor.id)"
                  >
                    Trả nợ
                  </VueButton>
                </div>
                <div>{{ formatMoney(distributor.debt) }}</div>
              </div>

              <div v-if="distributor.debt < 0">
                <div style="color: var(--text-green); font-weight: 500">
                  Số dư quỹ: {{ formatMoney(-distributor.debt) }}
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
                userPermission[PermissionId.DISTRIBUTOR_UPDATE]
              "
              class="text-center"
            >
              <a
                style="color: #eca52b"
                class="text-xl"
                @click="modalDistributorUpsert?.openModal(distributor.id)"
              >
                <IconEditSquare />
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="p-4 flex flex-wrap justify-end gap-4">
      <VuePagination
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
