<script setup lang="ts">
import { VueTag } from '@/common'
import VueButton from '@/common/VueButton.vue'
import VuePagination from '@/common/VuePagination.vue'
import { IconFileSearch, IconSetting } from '@/common/icon-antd'
import { IconDownload, IconEditSquare, IconUpload } from '@/common/icon-google'
import VueDropdown from '@/common/popover/VueDropdown.vue'
import { InputSelect, InputText, VueSelect } from '@/common/vue-form'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { FileLaboratoryApi } from '@/modules/file-excel/file-laboratory.api'
import { Laboratory, LaboratoryService, LaboratoryValueType } from '@/modules/laboratory'
import { LaboratoryGroup, LaboratoryGroupService } from '@/modules/laboratory-group'
import { PermissionId } from '@/modules/permission/permission.enum'
import { arrayToKeyValue } from '@/utils'
import { computed, onBeforeMount, ref } from 'vue'
import Breadcrumb from '../../../component/Breadcrumb.vue'
import ModalLaboratoryDetail from '../detail/ModalLaboratoryDetail.vue'
import ModalLaboratoryUpsert from '../upsert/ModalLaboratoryUpsert.vue'
import ModalCopyLaboratorySystem from './ModalCopyLaboratorySystem.vue'
import ModalLaboratoryGroupManager from './ModalLaboratoryGroupManager.vue'
import ModalUploadLaboratory from './ModalUploadLaboratory.vue'
import { IconSortChange } from '@/common/icon-font-awesome'

const modalCopyLaboratoryExample = ref<InstanceType<typeof ModalCopyLaboratorySystem>>()
const modalLaboratoryGroupManager = ref<InstanceType<typeof ModalLaboratoryGroupManager>>()
const modalLaboratoryUpsert = ref<InstanceType<typeof ModalLaboratoryUpsert>>()
const modalLaboratoryDetail = ref<InstanceType<typeof ModalLaboratoryDetail>>()
const modalUploadLaboratory = ref<InstanceType<typeof ModalUploadLaboratory>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const { userPermission } = MeService

const laboratoryList = ref<Laboratory[]>([])
const searchText = ref('')
const laboratoryGroupId = ref<number>(0)

const laboratoryGroupAll = ref<LaboratoryGroup[]>([])
const laboratoryGroupMap = computed(() => arrayToKeyValue(laboratoryGroupAll.value, 'id'))

const page = ref(1)
const limit = ref(Number(localStorage.getItem('LABORATORY_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const sortColumn = ref<'id' | 'laboratoryCode' | 'name' | 'price' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const dataLoading = ref(false)

const startFetchData = async (options?: { refetch?: boolean }) => {
  dataLoading.value = true

  try {
    const { data, meta } = await LaboratoryService.pagination(
      {
        page: page.value,
        limit: limit.value,
        relation: { laboratoryGroup: false, discountList: true },
        filter: {
          level: 1,
          laboratoryGroupId: laboratoryGroupId.value ? laboratoryGroupId.value : undefined,
          name: searchText.value ? { LIKE: searchText.value } : undefined,
        },
        sort: sortValue.value
          ? {
              name: sortColumn.value === 'name' ? sortValue.value : undefined,
              id: sortColumn.value === 'id' ? sortValue.value : undefined,
              laboratoryCode: sortColumn.value === 'laboratoryCode' ? sortValue.value : undefined,
              price: sortColumn.value === 'price' ? sortValue.value : undefined,
            }
          : { laboratoryCode: 'ASC' },
      },
      { refetch: !!options?.refetch },
    )

    laboratoryList.value = data
    total.value = meta.total
    dataLoading.value = true
  } catch (error) {
    console.log('🚀 ~ file: LaboratoryList.vue:59 ~ startFetchData ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

const startSearch = async () => {
  page.value = 1
  startFetchData()
}

const changeSort = async (column: 'id' | 'laboratoryCode' | 'name' | 'price') => {
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
    localStorage.setItem('LABORATORY_PAGINATION_LIMIT', String(options.limit))
  }
  startFetchData()
}

onBeforeMount(async () => {
  try {
    await startFetchData()
    laboratoryGroupAll.value = await LaboratoryGroupService.list({})
  } catch (error) {
    console.log('🚀 ~ file: LaboratoryList.vue:86 ~ onBeforeMount ~ error:', error)
  }
})

const handleModalCopyLaboratorySystemSuccess = async () => {
  startFetchData({ refetch: true })
  laboratoryGroupAll.value = await LaboratoryGroupService.list({}, { refetch: true })
}

const handleModalLaboratoryGroupManagerSuccess = async () => {
  laboratoryGroupAll.value = await LaboratoryGroupService.list({})
}

const handleModalLaboratoryUpsertSuccess = async () => {
  await startFetchData()
}

const downloadExcelLaboratoryList = async () => {
  ModalStore.confirm({
    title: 'Xác nhận tải file báo cáo',
    content: 'Thời gian tải file có thể tốn vài phút nếu dữ liệu lớn, bạn vẫn mốn tải ?',
    onOk: async () => {
      await FileLaboratoryApi.downloadExcel()
    },
  })
}

const handleModalUploadLaboratorySuccess = async () => {
  startFetchData({ refetch: true })
  laboratoryGroupAll.value = await LaboratoryGroupService.list({}, { refetch: true })
}
</script>

<template>
  <ModalLaboratoryUpsert
    ref="modalLaboratoryUpsert"
    @success="handleModalLaboratoryUpsertSuccess"
  />
  <ModalCopyLaboratorySystem
    ref="modalCopyLaboratoryExample"
    @success="handleModalCopyLaboratorySystemSuccess"
  />
  <ModalLaboratoryGroupManager
    ref="modalLaboratoryGroupManager"
    @success="handleModalLaboratoryGroupManagerSuccess"
  />
  <ModalLaboratoryDetail ref="modalLaboratoryDetail" />
  <ModalUploadLaboratory
    ref="modalUploadLaboratory"
    @success="handleModalUploadLaboratorySuccess"
  />

  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
    <div class="">
      <VueButton
        v-if="userPermission[PermissionId.LABORATORY_CREATE]"
        color="blue"
        icon="plus"
        @click="modalLaboratoryUpsert?.openModal()"
      >
        Thêm mới
      </VueButton>
    </div>
    <div class="ml-auto flex items-center gap-8">
      <div v-if="!isMobile">
        <VueButton
          v-if="userPermission[PermissionId.FILE_EXCEL_UPLOAD_LABORATORY]"
          :icon="IconUpload"
          @click="modalUploadLaboratory?.openModal()"
        >
          Upload
        </VueButton>
      </div>
      <div v-if="!isMobile">
        <VueButton
          v-if="userPermission[PermissionId.FILE_EXCEL_DOWNLOAD_LABORATORY]"
          :icon="IconDownload"
          @click="downloadExcelLaboratoryList"
        >
          Download
        </VueButton>
      </div>
      <VueButton
        v-if="userPermission[PermissionId.LABORATORY_GROUP_CRUD]"
        icon="send"
        color="green"
        @click="modalLaboratoryGroupManager?.openModal()"
      >
        Nhóm xét nghiệm
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
            @click="modalCopyLaboratoryExample?.openModal()"
          >
            Copy dữ liệu từ hệ thống
          </a>
        </div>
      </VueDropdown>
    </div>
  </div>
  <div class="mt-4 md:mx-4 p-4 bg-white">
    <div class="flex flex-wrap gap-4">
      <div style="flex: 2; flex-basis: 500px">
        <div>Tìm kiếm</div>
        <div>
          <InputText v-model:value="searchText" @update:value="startSearch" />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 250px">
        <div>Chọn phiếu</div>
        <div>
          <VueSelect
            v-model:value="laboratoryGroupId"
            :options="[
              { value: 0, text: 'Tất cả' },
              ...laboratoryGroupAll.map((group) => ({ value: group.id, text: group.name })),
            ]"
            @update:value="startSearch"
          />
        </div>
      </div>
    </div>
    <div class="mt-4 table-wrapper">
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
            <th class="cursor-pointer" @click="changeSort('laboratoryCode')">
              <div class="flex items-center gap-1 justify-center">
                <span>Mã</span>
                <IconSortChange :sort="sortColumn === 'laboratoryCode' ? sortValue : ''" />
              </div>
            </th>
            <th class="cursor-pointer" @click="changeSort('name')">
              <div class="flex items-center gap-1 justify-center">
                <span>Tên</span>
                <IconSortChange :sort="sortColumn === 'name' ? sortValue : ''" />
              </div>
            </th>
            <th>Nhóm</th>
            <th>Tham chiếu</th>
            <th>Đơn vị</th>
            <th>Giá vốn</th>
            <th class="cursor-pointer" @click="changeSort('price')">
              <div class="flex items-center gap-1 justify-center">
                <span>Giá tiền</span>
                <IconSortChange :sort="sortColumn === 'price' ? sortValue : ''" />
              </div>
            </th>
            <th>Khuyến mại</th>
            <th v-if="userPermission[PermissionId.LABORATORY_UPDATE]">Action</th>
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
          <tr v-if="laboratoryList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="laboratory in laboratoryList" :key="laboratory.id">
            <td v-if="CONFIG.MODE === 'development'" class="text-center" style="color: violet">
              {{ laboratory.id }}
            </td>
            <td class="text-center">{{ laboratory.laboratoryCode }}</td>
            <td>
              <div class="flex items-center">
                {{ laboratory.name }}
                <a class="ml-1" @click="modalLaboratoryDetail?.openModal(laboratory.id)">
                  <IconFileSearch />
                </a>
              </div>
              <div style="font-style: italic; font-size: 0.9em">
                {{ laboratory.children?.map((i) => i.name).join(', ') }}
              </div>
            </td>
            <td class="text-left">
              <span v-if="laboratoryGroupMap[laboratory.laboratoryGroupId]">
                {{ laboratoryGroupMap[laboratory.laboratoryGroupId]?.name }}
              </span>
              <span v-else-if="laboratory.laboratoryGroupId === 0" class="italic">
                Chưa phân nhóm
              </span>
              <span v-else class="italic line-through">Nhóm bị xóa</span>
            </td>
            <td class="text-right">
              {{
                laboratory.valueType === LaboratoryValueType.Number
                  ? laboratory.lowValue + ' - ' + laboratory.highValue
                  : ''
              }}
            </td>
            <td class="text-right">
              {{ laboratory.valueType === LaboratoryValueType.Number ? laboratory.unit : '' }}
            </td>
            <td class="text-right">{{ formatMoney(laboratory.costPrice) }}</td>
            <td class="text-right">{{ formatMoney(laboratory.price) }}</td>
            <td class="text-center">
              <VueTag
                v-if="
                  laboratory.discountApply.discountMoney || laboratory.discountApply.discountPercent
                "
                color="blue"
              >
                {{ laboratory.discountApply?.valueText }}
              </VueTag>
            </td>
            <td v-if="userPermission[PermissionId.LABORATORY_UPDATE]" class="text-center">
              <a
                style="color: var(--text-orange)"
                @click="modalLaboratoryUpsert?.openModal(laboratory.id)"
              >
                <IconEditSquare width="24px" height="24px" />
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
