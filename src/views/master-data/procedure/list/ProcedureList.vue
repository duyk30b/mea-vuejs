<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import VuePagination from '@/common/VuePagination.vue'
import VueTag from '@/common/VueTag.vue'
import { IconDownload, IconFileSearch, IconSetting, IconUpload } from '@/common/icon-antd'
import { IconSort, IconSortChange, IconSortDown, IconSortUp } from '@/common/icon-font-awesome'
import { IconEditSquare } from '@/common/icon-google'
import VueDropdown from '@/common/popover/VueDropdown.vue'
import { InputSelect, InputText, VueSelect } from '@/common/vue-form'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { FileProcedureApi } from '@/modules/file-excel/file-procedure.api'
import { PermissionId } from '@/modules/permission/permission.enum'
import { Procedure, ProcedureService, ProcedureType, ProcedureTypeText } from '@/modules/procedure'
import { ProcedureGroup, ProcedureGroupService } from '@/modules/procedure-group'
import { arrayToKeyValue } from '@/utils'
import { computed, onBeforeMount, ref } from 'vue'
import Breadcrumb from '../../../component/Breadcrumb.vue'
import ModalProcedureDetail from '../detail/ModalProcedureDetail.vue'
import ModalProcedureUpsert from '../upsert/ModalProcedureUpsert.vue'
import ModalProcedureGroupManager from './ModalProcedureGroupManager.vue'
import ModalProcedureListSettingScreen from './ModalProcedureListSettingScreen.vue'
import ModalUploadProcedure from './ModalUploadProcedure.vue'

const modalProcedureUpsert = ref<InstanceType<typeof ModalProcedureUpsert>>()
const modalProcedureListSettingScreen = ref<InstanceType<typeof ModalProcedureListSettingScreen>>()
const modalProcedureGroupManager = ref<InstanceType<typeof ModalProcedureGroupManager>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()
const modalUploadProcedure = ref<InstanceType<typeof ModalUploadProcedure>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

const procedureList = ref<Procedure[]>([])
const procedureGroupAll = ref<ProcedureGroup[]>([])

const dataLoading = ref(false)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PROCEDURE_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const searchText = ref('')
const procedureGroupId = ref<number>(0)
const isActive = ref<1 | 0 | ''>(1)

const sortColumn = ref<'id' | 'code' | 'name' | 'price' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const procedureGroupMap = computed(() => arrayToKeyValue(procedureGroupAll.value, 'id'))

const startFetchData = async (options?: { refetch?: boolean }) => {
  try {
    dataLoading.value = true
    const response = await ProcedureService.pagination(
      {
        page: page.value,
        limit: limit.value,
        relation: { discountList: true },
        filter: {
          isActive: isActive.value !== '' ? isActive.value : undefined,
          name: searchText.value ? { LIKE: searchText.value } : undefined,
          procedureGroupId: procedureGroupId.value ? procedureGroupId.value : undefined,
        },
        sort: sortValue.value
          ? {
              id: sortColumn.value === 'id' ? sortValue.value : undefined,
              code: sortColumn.value === 'code' ? sortValue.value : undefined,
              name: sortColumn.value === 'name' ? sortValue.value : undefined,
              price: sortColumn.value === 'price' ? sortValue.value : undefined,
            }
          : { code: 'ASC' },
      },
      { refetch: !!options?.refetch },
    )
    procedureList.value = response.data
    total.value = response.meta.total

    dataLoading.value = false
  } catch (error) {
    console.log('🚀 ~ file: ProcedureList.vue:73 ~ error:', error)
  }
}

onBeforeMount(async () => {
  await startFetchData({ refetch: true })
  procedureGroupAll.value = await ProcedureGroupService.list({})
})

const startSearch = async () => {
  page.value = 1
  await startFetchData()
}

const changeSort = async (column: 'id' | 'code' | 'name' | 'price') => {
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

const handleModalProcedureGroupManagerSuccess = async () => {
  procedureGroupAll.value = await ProcedureGroupService.list({})
}

const downloadExcelProcedureList = async () => {
  ModalStore.confirm({
    title: 'Xác nhận tải file báo cáo',
    content: 'Thời gian tải file có thể tốn vài phút nếu dữ liệu lớn, bạn vẫn mốn tải ?',
    onOk: async () => {
      await FileProcedureApi.downloadExcel()
    },
  })
}

const handleModalUploadProcedureSuccess = async () => {
  await startFetchData({ refetch: true })
}
</script>

<template>
  <ModalProcedureUpsert ref="modalProcedureUpsert" @success="handleModalProcedureUpsertSuccess" />
  <ModalProcedureListSettingScreen ref="modalProcedureListSettingScreen" />
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <ModalProcedureGroupManager
    ref="modalProcedureGroupManager"
    @success="handleModalProcedureGroupManagerSuccess"
  />
  <ModalUploadProcedure ref="modalUploadProcedure" @success="handleModalUploadProcedureSuccess" />
  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
    <div>
      <VueButton
        v-if="userPermission[PermissionId.PROCEDURE_CREATE]"
        color="blue"
        icon="plus"
        @click="modalProcedureUpsert?.openModal()"
      >
        Thêm mới
      </VueButton>
    </div>
    <div class="ml-auto flex items-center gap-8">
      <div v-if="!isMobile">
        <VueButton
          v-if="userPermission[PermissionId.FILE_EXCEL_UPLOAD_PROCEDURE]"
          :icon="IconUpload"
          @click="modalUploadProcedure?.openModal()"
        >
          Upload
        </VueButton>
      </div>
      <div v-if="!isMobile">
        <VueButton
          v-if="userPermission[PermissionId.FILE_EXCEL_DOWNLOAD_PROCEDURE]"
          :icon="IconDownload"
          @click="downloadExcelProcedureList"
        >
          Download
        </VueButton>
      </div>
      <VueButton
        v-if="userPermission[PermissionId.PROCEDURE_GROUP_CRUD]"
        icon="send"
        color="green"
        @click="modalProcedureGroupManager?.openModal()"
      >
        Nhóm dịch vụ
      </VueButton>
      <VueDropdown>
        <template #trigger>
          <span style="font-size: 1.2rem; cursor: pointer">
            <IconSetting />
          </span>
        </template>
        <div class="vue-menu">
          <a
            v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
            @click="modalProcedureListSettingScreen?.openModal()"
          >
            Cài đặt hiển thị
          </a>
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

      <div style="flex: 1; flex-basis: 250px">
        <div>Chọn nhóm</div>
        <div>
          <VueSelect
            v-model:value="procedureGroupId"
            :options="[
              { value: 0, text: 'Tất cả' },
              ...procedureGroupAll.map((group) => ({ value: group.id, text: group.name })),
            ]"
            @update:value="startSearch"
          />
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
            @update:value="startSearch"
          />
        </div>
      </div>
    </div>
    <div v-if="isMobile" class="page-main-list table-wrapper">
      <div
        class="py-2 px-4 flex justify-between text-white font-bold"
        style="background-color: var(--color-table-thead-bg)"
      >
        <div
          class="cursor-pointer flex items-center gap-1 justify-center"
          @click="changeSort('name')"
        >
          <span>Tên</span>
          <IconSort v-if="sortColumn !== 'name'" style="opacity: 0.4" />
          <IconSortUp v-if="sortColumn === 'name' && sortValue === 'ASC'" style="opacity: 0.4" />
          <IconSortDown v-if="sortColumn === 'name' && sortValue === 'DESC'" style="opacity: 0.4" />
        </div>
        <div
          class="cursor-pointer flex items-center gap-1 justify-center"
          @click="changeSort('price')"
        >
          <span>Giá</span>
          <IconSort v-if="sortColumn !== 'price'" style="opacity: 0.4" />
          <IconSortUp v-if="sortColumn === 'price' && sortValue === 'ASC'" style="opacity: 0.4" />
          <IconSortDown
            v-if="sortColumn === 'price' && sortValue === 'DESC'"
            style="opacity: 0.4"
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
        @dblclick="modalProcedureUpsert?.openModal(procedure.id)"
      >
        <div>
          <div class="flex gap-2">
            <div class="font-medium text-justify">
              {{ procedure.name }}
            </div>
            <div>
              <a
                class="text-base"
                style="line-height: 0"
                @click="modalProcedureDetail?.openModal(procedure.id)"
              >
                <IconFileSearch />
              </a>
            </div>
          </div>
          <div>
            {{ procedureGroupAll[procedure.procedureGroupId] }}
          </div>
        </div>
        <div>
          {{ formatMoney(procedure.price) }}
        </div>
      </div>
    </div>
    <div v-if="!isMobile" class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th
              v-if="CONFIG.MODE === 'development'"
              class="cursor-pointer"
              @click="changeSort('id')"
            >
              <div class="flex items-center gap-1 justify-center">
                <span>ID</span>
                <IconSortChange :sort="sortColumn === 'id' ? sortValue : ''" />
              </div>
            </th>
            <th class="cursor-pointer" @click="changeSort('code')">
              <div class="flex items-center gap-1 justify-center">
                <span>Mã DV</span>
                <IconSortChange :sort="sortColumn === 'code' ? sortValue : ''" />
              </div>
            </th>
            <th class="cursor-pointer" @click="changeSort('name')">
              <div class="flex items-center gap-1 justify-center">
                <span>Tên</span>
                <IconSortChange :sort="sortColumn === 'name' ? sortValue : ''" />
              </div>
            </th>
            <th>Loại</th>
            <th>Nhóm</th>
            <th class="cursor-pointer" @click="changeSort('price')">
              <div class="flex items-center gap-1 justify-center">
                <span>Giá</span>
                <IconSortChange :sort="sortColumn === 'price' ? sortValue : ''" />
              </div>
            </th>
            <th>Khuyến mại</th>
            <th>Trạng thái</th>
            <th v-if="userPermission[PermissionId.PROCEDURE_UPDATE]">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="procedureList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="procedure in procedureList" :key="procedure.id">
            <td class="text-center" v-if="CONFIG.MODE === 'development'" style="color: violet">
              {{ procedure.id }}
            </td>
            <td class="text-center">{{ procedure.code }}</td>
            <td>
              <span>{{ procedure.name }}</span>
              <span v-if="procedure.procedureType === ProcedureType.Regimen" class="font-bold">
                ({{ procedure.totalSessions }} buổi)
              </span>
              <a class="ml-1" @click="modalProcedureDetail?.openModal(procedure.id)">
                <IconFileSearch />
              </a>
            </td>
            <td class="text-center">
              {{ ProcedureTypeText[procedure.procedureType] }}
            </td>
            <td class="text-center">
              {{ procedureGroupMap[procedure.procedureGroupId]?.name }}
            </td>
            <td class="text-right">
              {{ formatMoney(procedure.price) }}
            </td>
            <td class="text-center">
              <VueTag
                v-if="
                  procedure.discountApply?.discountMoney || procedure.discountApply?.discountPercent
                "
                color="blue"
              >
                {{ procedure.discountApply?.valueText }}
              </VueTag>
            </td>
            <td class="text-center">
              <VueTag v-if="procedure.isActive" icon="check" color="green">Active</VueTag>
              <VueTag v-else icon="minus" color="orange">Active</VueTag>
            </td>
            <td v-if="userPermission[PermissionId.PRODUCT_UPDATE]" class="text-center">
              <a
                style="color: #eca52b"
                class="text-xl"
                @click="modalProcedureUpsert?.openModal(procedure.id)"
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
        class="ml-auto"
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
