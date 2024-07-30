<script setup lang="ts">
import {
  CheckCircleOutlined,
  FormOutlined,
  MinusCircleOutlined,
  NodeIndexOutlined,
} from '@ant-design/icons-vue'
import { onBeforeMount, onMounted, ref } from 'vue'
import VueButton from '../../common/VueButton.vue'
import { IconFileSearch, IconSetting } from '../../common/icon'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { InputText, VueSelect } from '../../common/vue-form'
import { useMeStore } from '../../modules/_me/me.store'
import { useSettingStore } from '../../modules/_me/setting.store'
import { PermissionId } from '../../modules/permission/permission.enum'
import { Procedure, useProcedureStore } from '../../modules/procedure'
import ModalDataProcedure from './components/ModalDataProcedure.vue'
import ModalProcedureListSettingScreen from './components/ModalProcedureListSettingScreen.vue'
import ModalProcedureUpsert from './components/ModalProcedureUpsert.vue'
import ModalProcedureDetail from './detail/ModalProcedureDetail.vue'

const modalProcedureUpsert = ref<InstanceType<typeof ModalProcedureUpsert>>()
const modalDataProcedure = ref<InstanceType<typeof ModalDataProcedure>>()
const modalProcedureListSettingScreen = ref<InstanceType<typeof ModalProcedureListSettingScreen>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()

const procedureStore = useProcedureStore()
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const procedureList = ref<Procedure[]>([])

const dataLoading = ref(false)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PROCEDURE_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const searchText = ref('')
const group = ref<string>('')
const isActive = ref<1 | 0 | ''>(1)

const sortColumn = ref<'id' | 'name' | 'price' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const startFetchData = async () => {
  try {
    const response = await procedureStore.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        isActive: isActive.value !== '' ? isActive.value : undefined,
        searchText: searchText.value ? searchText.value : undefined,
        group: group.value ? group.value : undefined,
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
    total.value = response.total

    dataLoading.value = false
  } catch (error) {
    console.log('🚀 ~ file: ProcedureList.vue:61 ~ error:', error)
  }
}

onBeforeMount(async () => {
  try {
    dataLoading.value = true
    await startFetchData()
  } catch (error) {
    console.log('🚀 ~ onBeforeMount ~ error:', error)
  } finally {
    dataLoading.value = false
  }
})

onMounted(async () => {
  try {
    const procedureList = await procedureStore.refreshDB() // reload nếu có dữ liệu mới nhất
    if (procedureList?.length) {
      await startFetchData()
    }
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
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

const handleModalProcedureUpsertSuccess = async (
  data: Procedure,
  type: 'CREATE' | 'UPDATE' | 'DELETE'
) => {
  await startFetchData()
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalProcedureListSettingScreen.value?.openModal()
  }
  if (menu.key === 'data-setting') {
    modalDataProcedure.value?.openModal()
  }
}
</script>

<template>
  <ModalProcedureUpsert ref="modalProcedureUpsert" @success="handleModalProcedureUpsertSuccess" />
  <ModalProcedureListSettingScreen ref="modalProcedureListSettingScreen" />
  <ModalDataProcedure ref="modalDataProcedure" />
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block">
        <NodeIndexOutlined />
        Danh sách dịch vụ
      </div>
      <VueButton
        v-if="permissionIdMap[PermissionId.PROCEDURE_CREATE]"
        color="blue"
        icon="plus"
        @click="modalProcedureUpsert?.openModal()">
        Thêm mới
      </VueButton>
    </div>
    <div class="page-header-setting">
      <a-dropdown v-if="permissionIdMap[PermissionId.SETTING_UPSERT]" trigger="click">
        <span style="font-size: 1.2rem; cursor: pointer">
          <IconSetting />
        </span>
        <template #overlay>
          <a-menu @click="handleMenuSettingClick">
            <a-menu-item key="screen-setting">Cài đặt hiển thị</a-menu-item>
            <a-menu-item key="data-setting">Cài đặt dữ liệu</a-menu-item>
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
            v-model:value="group"
            :options="[
              { value: '', text: 'Tất cả' },
              ...Object.entries(settingStore.PROCEDURE_GROUP).map(([value, text]) => {
                return { value, text }
              }),
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
        @dblclick="modalProcedureUpsert?.openModal(procedure)">
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
            {{ settingStore.PROCEDURE_GROUP[procedure.group] }}
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
                permissionIdMap[PermissionId.PROCEDURE_UPDATE] &&
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
            <td class="text-center">PD{{ procedure.id }}</td>
            <td>
              {{ procedure.name }}
              <a
                v-if="settingStore.SCREEN_PROCEDURE_LIST.table.detail"
                class="ml-1"
                @click="modalProcedureDetail?.openModal(procedure!)">
                <IconFileSearch />
              </a>
            </td>
            <td v-if="settingStore.SCREEN_PROCEDURE_LIST.table.group" class="text-center">
              {{ settingStore.PROCEDURE_GROUP[procedure.group] }}
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
                permissionIdMap[PermissionId.PROCEDURE_UPDATE] &&
                settingStore.SCREEN_PROCEDURE_LIST.table.action
              "
              class="text-center">
              <a
                style="color: #eca52b"
                class="text-xl"
                @click="modalProcedureUpsert?.openModal(procedure)">
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
