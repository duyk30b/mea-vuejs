<script setup lang="ts">
import {
  CheckCircleOutlined,
  FileSearchOutlined,
  FormOutlined,
  MinusCircleOutlined,
  NodeIndexOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'
import { onBeforeMount, onMounted, ref } from 'vue'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { useMeStore } from '../../modules/_me/me.store'
import { useScreenStore } from '../../modules/_me/screen.store'
import { PermissionId } from '../../modules/permission/permission.enum'
import { Procedure, useProcedureStore } from '../../modules/procedure'
import ModalSettingDataProcedure from './components/ModalDataProcedure.vue'
import ModalProcedureListSettingScreen from './components/ModalProcedureListSettingScreen.vue'
import ModalProcedureUpsert from './components/ModalProcedureUpsert.vue'
import ModalProcedureDetail from './detail/ModalProcedureDetail.vue'
import { InputText } from '../../common/vue-form'

const modalProcedureUpsert = ref<InstanceType<typeof ModalProcedureUpsert>>()
const modalSettingDataProcedure = ref<InstanceType<typeof ModalSettingDataProcedure>>()
const modalProcedureListSettingScreen = ref<InstanceType<typeof ModalProcedureListSettingScreen>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()

const procedureStore = useProcedureStore()
const screenStore = useScreenStore()
const { formatMoney, isMobile } = screenStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const procedureList = ref<Procedure[]>([])

const dataLoading = ref(false)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PROCEDURE_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const searchText = ref('')
const group = ref<string>()
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

const handleSelectStatus = async (value: 'true' | 'false' | '') => {
  await startSearch()
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
    modalSettingDataProcedure.value?.openModal()
  }
}
</script>

<template>
  <ModalProcedureUpsert ref="modalProcedureUpsert" @success="handleModalProcedureUpsertSuccess" />
  <ModalProcedureListSettingScreen ref="modalProcedureListSettingScreen" />
  <ModalSettingDataProcedure ref="modalSettingDataProcedure" />
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block"><NodeIndexOutlined />Danh sách dịch vụ</div>
      <a-button
        v-if="permissionIdMap[PermissionId.PROCEDURE_CREATE]"
        type="primary"
        @click="modalProcedureUpsert?.openModal()"
      >
        <template #icon>
          <PlusOutlined />
        </template>
        Thêm mới
      </a-button>
    </div>
    <div class="page-header-setting">
      <a-dropdown v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_SCREEN]" trigger="click">
        <span style="font-size: 1.2rem; cursor: pointer">
          <SettingOutlined />
        </span>
        <template #overlay>
          <a-menu @click="handleMenuSettingClick">
            <a-menu-item key="screen-setting"> Cài đặt hiển thị </a-menu-item>
            <a-menu-item key="data-setting"> Cài đặt dữ liệu </a-menu-item>
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
        <a-select
          v-model:value="group"
          allow-clear
          class="w-full"
          placeholder="Tất cả"
          @change="startSearch"
        >
          <a-select-option :value="undefined"> Tất cả </a-select-option>
          <a-select-option
            v-for="(text, value) in screenStore.PROCEDURE_GROUP"
            :key="value"
            :value="value"
          >
            {{ text }}
          </a-select-option>
        </a-select>
      </div>

      <div style="flex: 1; flex-basis: 250px">
        <div>Chọn trạng thái</div>
        <a-select
          v-model:value="isActive"
          allow-clear
          class="w-full"
          placeholder="Tất cả"
          @change="handleSelectStatus"
        >
          <a-select-option value=""> Tất cả </a-select-option>
          <a-select-option :value="1"> Active </a-select-option>
          <a-select-option :value="0"> Inactive </a-select-option>
        </a-select>
      </div>
    </div>
    <div v-if="isMobile" class="page-main-list table-wrapper">
      <div
        class="py-2 px-4 flex justify-between text-white font-bold"
        style="background-color: var(--color-table-thead-bg)"
      >
        <div class="cursor-pointer" @click="changeSort('name')">
          Tên dịch vụ &nbsp;
          <font-awesome-icon
            v-if="sortColumn !== 'name'"
            :icon="['fas', 'sort']"
            style="opacity: 0.4"
          />
          <font-awesome-icon
            v-if="sortColumn === 'name' && sortValue === 'ASC'"
            :icon="['fas', 'sort-up']"
          />
          <font-awesome-icon
            v-if="sortColumn === 'name' && sortValue === 'DESC'"
            :icon="['fas', 'sort-down']"
          />
        </div>
        <div class="cursor-pointer" @click="changeSort('price')">
          Giá &nbsp;
          <font-awesome-icon
            v-if="sortColumn !== 'price'"
            :icon="['fas', 'sort']"
            style="opacity: 0.4"
          />
          <font-awesome-icon
            v-if="sortColumn === 'price' && sortValue === 'ASC'"
            :icon="['fas', 'sort-up']"
          />
          <font-awesome-icon
            v-if="sortColumn === 'price' && sortValue === 'DESC'"
            :icon="['fas', 'sort-down']"
          />
        </div>
      </div>
      <div
        v-if="procedureList.length === 0"
        class="p-2 text-center"
        style="border: 1px solid #cdcdcd"
      >
        Không có dữ liệu
      </div>
      <div
        v-for="(procedure, index) in procedureList"
        :key="index"
        class="px-4 py-2 flex items-center justify-between gap-4"
        style="border-bottom: 1px solid #cdcdcd"
        :style="{ backgroundColor: index % 2 !== 0 ? 'var(--color-table-td-even-bg)' : '' }"
        @dblclick="modalProcedureUpsert?.openModal(procedure)"
      >
        <div>
          <div class="flex gap-2">
            <div class="font-medium text-justify">
              {{ procedure.name }}
            </div>
            <div v-if="screenStore.SCREEN_PROCEDURE_LIST.table.detail">
              <a class="text-base" @click="modalProcedureDetail?.openModal(procedure.id)">
                <FileSearchOutlined />
              </a>
            </div>
          </div>
          <div v-if="screenStore.SCREEN_PROCEDURE_LIST.table.group">
            {{ screenStore.PROCEDURE_GROUP[procedure.group] }}
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
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })"
        />
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
            <th class="cursor-pointer" @click="changeSort('name')">
              Tên thủ thuật &nbsp;
              <font-awesome-icon
                v-if="sortColumn !== 'name'"
                :icon="['fas', 'sort']"
                style="opacity: 0.4"
              />
              <font-awesome-icon
                v-if="sortColumn === 'name' && sortValue === 'ASC'"
                :icon="['fas', 'sort-up']"
              />
              <font-awesome-icon
                v-if="sortColumn === 'name' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']"
              />
            </th>
            <th v-if="screenStore.SCREEN_PROCEDURE_LIST.table.group">Nhóm</th>
            <th class="cursor-pointer" @click="changeSort('price')">
              Giá tiền&nbsp;
              <font-awesome-icon
                v-if="sortColumn !== 'price'"
                :icon="['fas', 'sort']"
                style="opacity: 0.4"
              />
              <font-awesome-icon
                v-if="sortColumn === 'price' && sortValue === 'ASC'"
                :icon="['fas', 'sort-up']"
              />
              <font-awesome-icon
                v-if="sortColumn === 'price' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']"
              />
            </th>
            <th v-if="screenStore.SCREEN_PROCEDURE_LIST.table.status">Trạng thái</th>
            <th
              v-if="
                permissionIdMap[PermissionId.PROCEDURE_UPDATE] &&
                screenStore.SCREEN_PROCEDURE_LIST.table.action
              "
            >
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
                v-if="screenStore.SCREEN_PROCEDURE_LIST.table.detail"
                class="ml-1"
                @click="modalProcedureDetail?.openModal(procedure.id)"
              >
                <FileSearchOutlined />
              </a>
            </td>
            <td v-if="screenStore.SCREEN_PROCEDURE_LIST.table.group" class="text-center">
              {{ screenStore.PROCEDURE_GROUP[procedure.group] }}
            </td>
            <td class="text-right">
              {{ formatMoney(procedure.price) }}
            </td>
            <td v-if="screenStore.SCREEN_PROCEDURE_LIST.table.status" class="text-center">
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
                screenStore.SCREEN_PROCEDURE_LIST.table.action
              "
              class="text-center"
            >
              <a
                style="color: #eca52b"
                class="text-xl"
                @click="modalProcedureUpsert?.openModal(procedure)"
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
