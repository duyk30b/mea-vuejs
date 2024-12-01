<script setup lang="ts">
import { CheckCircleOutlined, MinusCircleOutlined, NodeIndexOutlined } from '@ant-design/icons-vue'
import { computed, onBeforeMount, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconFileSearch, IconSetting } from '../../../../common/icon'
import { IconEditSquare } from '../../../../common/icon-google'
import { InputText, VueSelect } from '../../../../common/vue-form'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { Procedure, ProcedureService } from '../../../../modules/procedure'
import { ProcedureGroup, ProcedureGroupService } from '../../../../modules/procedure-group'
import { arrayToKeyValue } from '../../../../utils'
import ModalProcedureDetail from '../detail/ModalProcedureDetail.vue'
import ModalProcedureUpsert from '../upsert/ModalProcedureUpsert.vue'
import ModalProcedureGroupManager from './ModalProcedureGroupManager.vue'
import ModalProcedureListSettingScreen from './ModalProcedureListSettingScreen.vue'

const modalProcedureUpsert = ref<InstanceType<typeof ModalProcedureUpsert>>()
const modalProcedureListSettingScreen = ref<InstanceType<typeof ModalProcedureListSettingScreen>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()
const modalProcedureGroupManager = ref<InstanceType<typeof ModalProcedureGroupManager>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const procedureList = ref<Procedure[]>([])
const procedureGroupAll = ref<ProcedureGroup[]>([])

const dataLoading = ref(false)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PROCEDURE_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const searchText = ref('')
const procedureGroupId = ref<number>(0)
const isActive = ref<1 | 0 | ''>(1)

const sortColumn = ref<'id' | 'name' | 'price' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const procedureGroupMap = computed(() => arrayToKeyValue(procedureGroupAll.value, 'id'))

const startFetchData = async () => {
  try {
    dataLoading.value = true
    const response = await ProcedureService.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        isActive: isActive.value !== '' ? isActive.value : undefined,
        name: searchText.value ? { LIKE: searchText.value } : undefined,
        procedureGroupId: procedureGroupId.value ? procedureGroupId.value : undefined,
      },
      sort: sortValue.value
        ? {
            name: sortColumn.value === 'name' ? sortValue.value : undefined,
            id: sortColumn.value === 'id' ? sortValue.value : undefined,
            price: sortColumn.value === 'price' ? sortValue.value : undefined,
          }
        : { id: 'DESC' },
    })
    procedureList.value = response.data
    total.value = response.meta.total

    dataLoading.value = false
  } catch (error) {
    console.log('🚀 ~ file: ProcedureList.vue:73 ~ error:', error)
  }
}

onBeforeMount(async () => {
  await startFetchData()
  try {
    procedureGroupAll.value = await ProcedureGroupService.list({})
  } catch (error) {
    console.log('🚀 ~ file: ProcedureList.vue:83 ~ onBeforeMount ~ error:', error)
  }
})

const startSearch = async () => {
  page.value = 1
  await startFetchData()
}

const changeSort = async (column: 'id' | 'name' | 'price') => {
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
    localStorage.setItem('PROCEDURE_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

const handleModalProcedureUpsertSuccess = async () => {
  await startFetchData()
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalProcedureListSettingScreen.value?.openModal()
  }
  if (menu.key === 'PROCEDURE_GROUP_MANAGER') {
    modalProcedureGroupManager.value?.openModal()
  }
}

const handleModalProcedureGroupManagerSuccess = async () => {
  procedureGroupAll.value = await ProcedureGroupService.list({})
}
</script>

<template>
  <ModalProcedureUpsert ref="modalProcedureUpsert" @success="handleModalProcedureUpsertSuccess" />
  <ModalProcedureListSettingScreen ref="modalProcedureListSettingScreen" />
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <ModalProcedureGroupManager
    ref="modalProcedureGroupManager"
    @success="handleModalProcedureGroupManagerSuccess" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block">
        <NodeIndexOutlined />
        Danh sách dịch vụ
      </div>
      <VueButton
        v-if="permissionIdMap[PermissionId.MASTER_DATA_PROCEDURE]"
        color="blue"
        icon="plus"
        @click="modalProcedureUpsert?.openModal()">
        Thêm mới
      </VueButton>
    </div>
    <div class="page-header-setting">
      <a-dropdown v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]" trigger="click">
        <span style="font-size: 1.2rem; cursor: pointer">
          <IconSetting />
        </span>
        <template #overlay>
          <a-menu @click="handleMenuSettingClick">
            <a-menu-item key="screen-setting">Cài đặt hiển thị</a-menu-item>
            <a-menu-item key="PROCEDURE_GROUP_MANAGER">Quản lý nhóm dịch vụ</a-menu-item>
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

      <div style="flex: 1; flex-basis: 250px">
        <div>Chọn nhóm</div>
        <div>
          <VueSelect
            v-model:value="procedureGroupId"
            :options="[
              { value: 0, text: 'Tất cả' },
              ...procedureGroupAll.map((group) => ({ value: group.id, text: group.name })),
            ]"
            @update:value="startSearch" />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 250px">
        <div>Chọn trạng thái</div>
        <div>
          <VueSelect
            v-model:value="isActive"
            :options="[
              { text: 'Tất cả', value: '' },
              { text: 'Active', value: 1 },
              { text: 'Inactive', value: 0 },
            ]"
            @update:value="startSearch" />
        </div>
      </div>
    </div>
    <div v-if="isMobile" class="page-main-list table-wrapper">
      <div
        class="py-2 px-4 flex justify-between text-white font-bold"
        style="background-color: var(--color-table-thead-bg)">
        <div class="cursor-pointer" @click="changeSort('name')">
          Tên dịch vụ &nbsp;
          <font-awesome-icon
            v-if="sortColumn !== 'name'"
            :icon="['fas', 'sort']"
            style="opacity: 0.4" />
          <font-awesome-icon
            v-if="sortColumn === 'name' && sortValue === 'ASC'"
            :icon="['fas', 'sort-up']" />
          <font-awesome-icon
            v-if="sortColumn === 'name' && sortValue === 'DESC'"
            :icon="['fas', 'sort-down']" />
        </div>
        <div class="cursor-pointer" @click="changeSort('price')">
          Giá &nbsp;
          <font-awesome-icon
            v-if="sortColumn !== 'price'"
            :icon="['fas', 'sort']"
            style="opacity: 0.4" />
          <font-awesome-icon
            v-if="sortColumn === 'price' && sortValue === 'ASC'"
            :icon="['fas', 'sort-up']" />
          <font-awesome-icon
            v-if="sortColumn === 'price' && sortValue === 'DESC'"
            :icon="['fas', 'sort-down']" />
        </div>
      </div>
      <div
        v-if="procedureList.length === 0"
        class="p-2 text-center"
        style="border: 1px solid #cdcdcd">
        Không có dữ liệu
      </div>
      <div
        v-for="(procedure, index) in procedureList"
        :key="index"
        class="px-4 py-2 flex items-center justify-between gap-4"
        style="border-bottom: 1px solid #cdcdcd"
        :style="{ backgroundColor: index % 2 !== 0 ? 'var(--color-table-td-even-bg)' : '' }"
        @dblclick="modalProcedureUpsert?.openModal(procedure.id)">
        <div>
          <div class="flex gap-2">
            <div class="font-medium text-justify">
              {{ procedure.name }}
            </div>
            <div v-if="settingStore.SCREEN_PROCEDURE_LIST.table.detail">
              <a
                class="text-base"
                style="line-height: 0"
                @click="modalProcedureDetail?.openModal(procedure)">
                <IconFileSearch />
              </a>
            </div>
          </div>
          <div v-if="settingStore.SCREEN_PROCEDURE_LIST.table.group">
            {{ procedureGroupAll[procedure.procedureGroupId] }}
          </div>
        </div>
        <div>
          {{ formatMoney(procedure.price) }}
        </div>
      </div>
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
    <div v-else class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th class="cursor-pointer" @click="changeSort('id')">
              Mã DV &nbsp;
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
            <th class="cursor-pointer" @click="changeSort('name')">
              Tên thủ thuật &nbsp;
              <font-awesome-icon
                v-if="sortColumn !== 'name'"
                :icon="['fas', 'sort']"
                style="opacity: 0.4" />
              <font-awesome-icon
                v-if="sortColumn === 'name' && sortValue === 'ASC'"
                :icon="['fas', 'sort-up']" />
              <font-awesome-icon
                v-if="sortColumn === 'name' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']" />
            </th>
            <th v-if="settingStore.SCREEN_PROCEDURE_LIST.table.group">Nhóm</th>
            <th class="cursor-pointer" @click="changeSort('price')">
              Giá tiền&nbsp;
              <font-awesome-icon
                v-if="sortColumn !== 'price'"
                :icon="['fas', 'sort']"
                style="opacity: 0.4" />
              <font-awesome-icon
                v-if="sortColumn === 'price' && sortValue === 'ASC'"
                :icon="['fas', 'sort-up']" />
              <font-awesome-icon
                v-if="sortColumn === 'price' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']" />
            </th>
            <th v-if="settingStore.SCREEN_PROCEDURE_LIST.table.status">Trạng thái</th>
            <th
              v-if="
                permissionIdMap[PermissionId.MASTER_DATA_PROCEDURE] &&
                settingStore.SCREEN_PROCEDURE_LIST.table.action
              ">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="procedureList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(procedure, i) in procedureList" :key="i">
            <td class="text-center">DV{{ procedure.id }}</td>
            <td>
              {{ procedure.name }}
              <a
                v-if="settingStore.SCREEN_PROCEDURE_LIST.table.detail"
                class="ml-1"
                @click="modalProcedureDetail?.openModal(procedure)">
                <IconFileSearch />
              </a>
            </td>
            <td v-if="settingStore.SCREEN_PROCEDURE_LIST.table.group" class="text-center">
              {{ procedureGroupMap[procedure.procedureGroupId]?.name }}
            </td>
            <td class="text-right">
              {{ formatMoney(procedure.price) }}
            </td>
            <td v-if="settingStore.SCREEN_PROCEDURE_LIST.table.status" class="text-center">
              <a-tag v-if="procedure.isActive" color="success">
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
                permissionIdMap[PermissionId.MASTER_DATA_PROCEDURE] &&
                settingStore.SCREEN_PROCEDURE_LIST.table.action
              "
              class="text-center">
              <a
                style="color: #eca52b"
                class="text-xl"
                @click="modalProcedureUpsert?.openModal(procedure.id)">
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
