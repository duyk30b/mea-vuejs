<script setup lang="ts">
import { Procedure, ProcedureService } from '@/modules/procedure'
import { useOrganizationStore } from '@/store/organization.store'
import { convertViToEn, formatNumber } from '@/utils'
import {
  CheckCircleOutlined, FileSearchOutlined, FormOutlined,
  MinusCircleOutlined, NodeIndexOutlined, PlusOutlined, SettingOutlined,
} from '@ant-design/icons-vue'
import { onBeforeMount, ref } from 'vue'
import ModalSettingDataProcedure from './components/ModalDataProcedure.vue'
import ModalProcedureListSettingScreen from './components/ModalProcedureListSettingScreen.vue'
import ModalProcedureUpsert from './components/ModalProcedureUpsert.vue'
import ModalProcedureDetails from './details/ModalProcedureDetails.vue'

const modalProcedureUpsert = ref<InstanceType<typeof ModalProcedureUpsert>>()
const modalSettingDataProcedure = ref<InstanceType<typeof ModalSettingDataProcedure>>()
const modalProcedureListSettingScreen = ref<InstanceType<typeof ModalProcedureListSettingScreen>>()
const modalProcedureDetails = ref<InstanceType<typeof ModalProcedureDetails>>()

const organizationStore = useOrganizationStore()

const procedureList = ref<Procedure[]>([])

const loadingComponent = ref(false)

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const searchText = ref('')
const group = ref<string>()
const sortColumn = ref<'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')
const isActive = ref<'true' | 'false' | ''>('true')

const startFetchData = async () => {
  try {
    loadingComponent.value = true
    const sort: Record<string, 'ASC' | 'DESC'> = {}
    if (sortColumn.value !== '' && sortValue.value !== '') {
      sort[sortColumn.value] = sortValue.value
    }
    const response = await ProcedureService.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        is_active: isActive.value ? isActive.value : undefined,
        search_text: searchText.value ? convertViToEn(searchText.value) : undefined,
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
  await startFetchData()
})

const startSearch = async () => {
  page.value = 1
  await startFetchData()
}

const handleSelectStatus = async (value: 'true' | 'false' | '') => {
  await startSearch()
}

const changeSort = async (column: 'id') => {
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

const handleModalProcedureUpsertSuccess = async (newProcedure: Procedure, type: 'CREATE' | 'UPDATE') => {
  if (type === 'CREATE') {
    procedureList.value.unshift(newProcedure)
  }
  else if (type === 'UPDATE') {
    const findIndex = procedureList.value.findIndex((i) => i.id === newProcedure.id)
    if (findIndex !== -1) {
      procedureList.value[findIndex] = newProcedure
    }
  }
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
  <ModalProcedureDetails ref="modalProcedureDetails" />
  <div class="mx-4 mt-4">
    <div class="flex justify-between items-center">
      <div class="font-medium" style="font-size: 1.3rem;">
        <NodeIndexOutlined style="margin-right: 1rem" />Danh sách các dịch vụ - thủ thuật
        <a-button type="primary" @click="modalProcedureUpsert?.openModal()" class="btn-green" style="margin-left: 20px;">
          <template #icon>
            <PlusOutlined />
          </template>
          Thêm mới
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
              <a-menu-item key="data-setting"> Cài đặt dữ liệu </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>
  </div>

  <div class="mx-4 mt-4 p-4 bg-white">
    <div class="flex flex-wrap gap-4">
      <div style="flex: 2; flex-basis: 500px;">
        <div>Tìm kiếm</div>
        <a-input-search v-model:value="searchText" allow-clear enter-button
          placeholder="Nhập từ khóa. Ấn Enter để tìm kiếm" @search="startSearch" style="width: 100%" />
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
    <div class="table-wrapper mt-4 w-full">
      <table class="table">
        <thead>
          <tr>
            <th class="cursor-pointer" @click="changeSort('id')">Mã DV &nbsp;
              <font-awesome-icon v-if="sortColumn !== 'id'" :icon="['fas', 'sort']" style="opacity: 0.4;" />
              <font-awesome-icon v-if="sortColumn === 'id' && sortValue === 'ASC'" :icon="['fas', 'sort-up']" />
              <font-awesome-icon v-if="sortColumn === 'id' && sortValue === 'DESC'" :icon="['fas', 'sort-down']" />
            </th>
            <th>Tên thủ thuật</th>
            <th v-if="organizationStore.SCREEN_PROCEDURE_LIST.table.group">Nhóm</th>
            <th>Giá tiền</th>
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
            <td>
              <div class="flex justify-between">
                <div>{{ procedure.nameVi }}</div>
                <div v-if="organizationStore.SCREEN_PROCEDURE_LIST.table.detail">
                  <a class="text-xl" @click="modalProcedureDetails?.openModal(procedure)">
                    <FileSearchOutlined />
                  </a>
                </div>
              </div>
            </td>
            <td v-if="organizationStore.SCREEN_PROCEDURE_LIST.table.group" class="text-center">{{
              organizationStore.PROCEDURE_GROUP[procedure.group] }}
            </td>
            <td class="text-right">{{ formatNumber(procedure.price) }}</td>
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
        <a-pagination v-model:current="page" v-model:pageSize="limit" :total="total"
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })" />
      </div>
    </div>

  </div>
</template>
