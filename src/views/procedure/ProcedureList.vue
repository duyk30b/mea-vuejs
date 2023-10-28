<script setup lang="ts">
import { Procedure, ProcedureService, useProcedureStore } from '@/modules/procedure'
import { useOrganizationStore } from '@/store/organization.store'
import {
  CheckCircleOutlined, FileSearchOutlined, FormOutlined,
  MinusCircleOutlined, NodeIndexOutlined, PlusOutlined, SettingOutlined,
} from '@ant-design/icons-vue'
import { onBeforeMount, ref } from 'vue'
import ModalSettingDataProcedure from './components/ModalDataProcedure.vue'
import ModalProcedureListSettingScreen from './components/ModalProcedureListSettingScreen.vue'
import ModalProcedureUpsert from './components/ModalProcedureUpsert.vue'
import ModalProcedureDetail from './detail/ModalProcedureDetail.vue'

const modalProcedureUpsert = ref<InstanceType<typeof ModalProcedureUpsert>>()
const modalSettingDataProcedure = ref<InstanceType<typeof ModalSettingDataProcedure>>()
const modalProcedureListSettingScreen = ref<InstanceType<typeof ModalProcedureListSettingScreen>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()

const procedureStore = useProcedureStore()
const organizationStore = useOrganizationStore()
const { formatMoney } = organizationStore

const isMobile = window.innerWidth < 768

const procedureList = ref<Procedure[]>([])

const loadingComponent = ref(false)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PROCEDURE_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const searchText = ref('')
const group = ref<string>()
const isActive = ref<'true' | 'false' | ''>('true')

const sortColumn = ref<'id' | 'name' | 'price' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const startFetchData = async () => {
  try {
    loadingComponent.value = true
    const sort: Record<string, 'ASC' | 'DESC'> = {}
    if (sortColumn.value !== '' && sortValue.value !== '') {
      sort[sortColumn.value] = sortValue.value
    }
    const response = procedureStore.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        is_active: isActive.value ? isActive.value : undefined,
        search_text: searchText.value ? searchText.value : undefined,
        group: group.value ? group.value : undefined,
      },
      sort,
    })
    procedureList.value = response.data
    total.value = response.total

    loadingComponent.value = false
  } catch (error) {
    console.log('🚀 ~ file: ProcedureList.vue:61 ~ error:', error)
  }
}

onBeforeMount(async () => {
  await procedureStore.fetchAll()
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

const changePagination = async (options: { page?: number, limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('PROCEDURE_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

const handleModalProcedureUpsertSuccess = async (newProcedure: Procedure, type: 'CREATE' | 'UPDATE') => {
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
      <div class="hidden md:block">
        <NodeIndexOutlined />Danh sách dịch vụ
      </div>
      <a-button type="primary" @click="modalProcedureUpsert?.openModal()">
        <template #icon>
          <PlusOutlined />
        </template>
        Thêm mới
      </a-button>
    </div>
    <div class="page-header-setting">
      <a-dropdown trigger="click">
        <span style="font-size: 1.2rem; cursor: pointer;">
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
      <div style="flex: 2; flex-basis: 500px;">
        <div>Tìm kiếm</div>
        <a-input-group compact class="w-full">
          <a-input :value="searchText" @input="handleInputSearchText" allow-clear style="width: calc(100% - 100px)" />
          <a-button type="primary" class="w-[100px]">Tìm kiếm</a-button>
        </a-input-group>
        <!-- <span class="ant-input-affix-wrapper">
          <input :value="searchText" @input="handleInputSearchText" allow-clear enter-button class="ant-input w-full"
            placeholder="Tìm kiếm bằng tên hoặc hoạt chất" />
        </span> -->
      </div>

      <div style="flex: 1; flex-basis: 250px;">
        <div>Chọn nhóm</div>
        <a-select v-model:value="group" allow-clear @change="startSearch" class="w-full" placeholder="Tất cả">
          <a-select-option :value="undefined">Tất cả</a-select-option>
          <a-select-option v-for="(text, value) in organizationStore.PROCEDURE_GROUP" :key="value" :value="value">
            {{ text }}
          </a-select-option>
        </a-select>
      </div>

      <div style="flex: 1; flex-basis: 250px;">
        <div>Chọn trạng thái</div>
        <a-select v-model:value="isActive" allow-clear @change="handleSelectStatus" class="w-full" placeholder="Tất cả">
          <a-select-option value="">Tất cả</a-select-option>
          <a-select-option value="true">Active</a-select-option>
          <a-select-option value="false">Inactive</a-select-option>
        </a-select>
      </div>
    </div>
    <div v-if="isMobile" class="page-main-list">
      <div class="py-2 px-4 flex justify-between text-white font-bold"
        style="background-color: var(--color-table-thead-bg);">
        <span>Tên dịch vụ</span>
        <span>Giá</span>
      </div>
      <div v-if="procedureList.length === 0" class="p-2 text-center" style="border: 1px solid #cdcdcd;">
        Không có dữ liệu
      </div>
      <div class="px-4 py-2 flex items-center justify-between gap-4" style="border-bottom: 1px solid #cdcdcd;"
        v-for="(procedure, index) in procedureList" :key="index" @dblclick="modalProcedureUpsert?.openModal(procedure)"
        :style="{ backgroundColor: index % 2 !== 0 ? 'var(--color-table-td-even-bg)' : '' }">
        <div>
          <div class="flex gap-2">
            <div class="font-medium text-justify">{{ procedure.name }}</div>
            <div v-if="organizationStore.SCREEN_PROCEDURE_LIST.table.detail">
              <a class="text-base" @click="modalProcedureDetail?.openModal(procedure)">
                <FileSearchOutlined />
              </a>
            </div>
          </div>
          <div v-if="organizationStore.SCREEN_PROCEDURE_LIST.table.group">{{
            organizationStore.PROCEDURE_GROUP[procedure.group] }}
          </div>
        </div>
        <div>
          {{ formatMoney(procedure.price) }}
        </div>
      </div>
      <div class="mt-4 float-right mb-2">
        <a-pagination size="small" v-model:current="page" v-model:pageSize="limit" :total="total" show-size-changer
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })" />
      </div>
    </div>
    <div v-else class="page-main-table table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th class="cursor-pointer" @click="changeSort('id')">Mã DV &nbsp;
              <font-awesome-icon v-if="sortColumn !== 'id'" :icon="['fas', 'sort']" style="opacity: 0.4;" />
              <font-awesome-icon v-if="sortColumn === 'id' && sortValue === 'ASC'" :icon="['fas', 'sort-up']" />
              <font-awesome-icon v-if="sortColumn === 'id' && sortValue === 'DESC'" :icon="['fas', 'sort-down']" />
            </th>
            <th class="cursor-pointer" @click="changeSort('name')">Tên thủ thuật &nbsp;
              <font-awesome-icon v-if="sortColumn !== 'name'" :icon="['fas', 'sort']" style="opacity: 0.4;" />
              <font-awesome-icon v-if="sortColumn === 'name' && sortValue === 'ASC'" :icon="['fas', 'sort-up']" />
              <font-awesome-icon v-if="sortColumn === 'name' && sortValue === 'DESC'" :icon="['fas', 'sort-down']" />
            </th>
            <th v-if="organizationStore.SCREEN_PROCEDURE_LIST.table.group">Nhóm</th>
            <th class="cursor-pointer" @click="changeSort('price')">Giá tiền&nbsp;
              <font-awesome-icon v-if="sortColumn !== 'price'" :icon="['fas', 'sort']" style="opacity: 0.4;" />
              <font-awesome-icon v-if="sortColumn === 'price' && sortValue === 'ASC'" :icon="['fas', 'sort-up']" />
              <font-awesome-icon v-if="sortColumn === 'price' && sortValue === 'DESC'" :icon="['fas', 'sort-down']" />
            </th>
            <th v-if="organizationStore.SCREEN_PROCEDURE_LIST.table.status">Trạng thái</th>
            <th v-if="organizationStore.SCREEN_PROCEDURE_LIST.table.action">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="procedureList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(procedure, i) in procedureList" :key="i">
            <td class="text-center">PD{{ procedure.id }}</td>
            <td>{{ procedure.name }}
              <a v-if="organizationStore.SCREEN_PROCEDURE_LIST.table.detail" class="ml-1"
                @click="modalProcedureDetail?.openModal(procedure)">
                <FileSearchOutlined />
              </a>
            </td>
            <td v-if="organizationStore.SCREEN_PROCEDURE_LIST.table.group" class="text-center">{{
              organizationStore.PROCEDURE_GROUP[procedure.group] }}
            </td>
            <td class="text-right">{{ formatMoney(procedure.price) }}</td>
            <td v-if="organizationStore.SCREEN_PROCEDURE_LIST.table.status" class="text-center">
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
            <td v-if="organizationStore.SCREEN_PROCEDURE_LIST.table.action" class="text-center">
              <a style="color: #eca52b;" class="text-xl" @click="modalProcedureUpsert?.openModal(procedure)">
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
