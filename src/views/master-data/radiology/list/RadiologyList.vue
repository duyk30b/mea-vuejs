<script setup lang="ts">
import { VueTag } from '@/common'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { CONFIG } from '@/config'
import { FileRadiologyApi } from '@/modules/file-excel/file-radiology.api'
import { computed, onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'
import VueButton from '../../../../common/VueButton.vue'
import VuePagination from '../../../../common/VuePagination.vue'
import { IconDownload, IconFileSearch, IconSetting, IconUpload } from '../../../../common/icon-antd'
import { IconEditSquare } from '../../../../common/icon-google'
import VueDropdown from '../../../../common/popover/VueDropdown.vue'
import { InputSelect, InputText, VueSelect } from '../../../../common/vue-form'
import { MeService } from '../../../../modules/_me/me.service'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { Radiology, RadiologyService } from '../../../../modules/radiology'
import { RadiologyGroup, RadiologyGroupService } from '../../../../modules/radiology-group'
import { arrayToKeyValue } from '../../../../utils'
import Breadcrumb from '../../../component/Breadcrumb.vue'
import ModalRadiologyDetail from '../detail/ModalRadiologyDetail.vue'
import ModalCopyRadiologySystem from './ModalCopyRadiologySystem.vue'
import ModalRadiologyGroupManager from './ModalRadiologyGroupManager.vue'
import ModalRadiologyListSettingScreen from './ModalRadiologyListSettingScreen.vue'
import ModalUploadRadiology from './ModalUploadRadiology.vue'
import { IconSort, IconSortChange, IconSortDown, IconSortUp } from '@/common/icon-font-awesome'

const modalRadiologyListSettingScreen = ref<InstanceType<typeof ModalRadiologyListSettingScreen>>()
const modalRadiologyGroupManager = ref<InstanceType<typeof ModalRadiologyGroupManager>>()
const modalRadiologyDetail = ref<InstanceType<typeof ModalRadiologyDetail>>()
const modalCopyRadiologySystem = ref<InstanceType<typeof ModalCopyRadiologySystem>>()
const modalUploadRadiology = ref<InstanceType<typeof ModalUploadRadiology>>()

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const { userPermission } = MeService

const radiologyList = ref<Radiology[]>([])
const searchText = ref('')
const radiologyGroupId = ref<number>(0)

const radiologyGroupAll = ref<RadiologyGroup[]>([])
const radiologyGroupMap = computed(() => arrayToKeyValue(radiologyGroupAll.value, 'id'))

const page = ref(1)
const limit = ref(Number(localStorage.getItem('RADIOLOGY_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const sortColumn = ref<'id' | 'radiologyCode' | 'name' | 'price' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const dataLoading = ref(false)

const startFetchData = async (options?: { refetch?: boolean }) => {
  dataLoading.value = true
  try {
    const { data, meta } = await RadiologyService.pagination(
      {
        page: page.value,
        limit: limit.value,
        relation: {
          radiologyGroup: false,
          discountList: true,
          printHtml: settingStore.SCREEN_RADIOLOGY_LIST.table.printHtml,
        },
        filter: {
          radiologyGroupId: radiologyGroupId.value ? radiologyGroupId.value : undefined,
          name: searchText.value ? { LIKE: searchText.value } : undefined,
        },
        sort: sortValue.value
          ? {
              name: sortColumn.value === 'name' ? sortValue.value : undefined,
              id: sortColumn.value === 'id' ? sortValue.value : undefined,
              radiologyCode: sortColumn.value === 'radiologyCode' ? sortValue.value : undefined,
              price: sortColumn.value === 'price' ? sortValue.value : undefined,
            }
          : { radiologyCode: 'ASC' },
      },
      { refetch: !!options?.refetch },
    )

    radiologyList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: RadiologyList.vue:56 ~ startFetchData ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

const startSearch = async () => {
  page.value = 1
  startFetchData()
}

const changeSort = async (column: 'id' | 'radiologyCode' | 'name' | 'price') => {
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
    localStorage.setItem('RADIOLOGY_PAGINATION_LIMIT', String(options.limit))
  }
  startFetchData()
}

onBeforeMount(async () => {
  try {
    await startFetchData()
    radiologyGroupAll.value = await RadiologyGroupService.list({})
  } catch (error) {
    console.log('🚀 ~ file: RadiologyList.vue:86 ~ onBeforeMount ~ error:', error)
  }
})

const handleModalCopyRadiologySystemSuccess = async () => {
  startFetchData({ refetch: true })
  radiologyGroupAll.value = await RadiologyGroupService.list({}, { refetch: true })
}

const handleModalRadiologyGroupManagerSuccess = async () => {
  radiologyGroupAll.value = await RadiologyGroupService.list({})
}

const downloadExcelRadiologyList = async () => {
  ModalStore.confirm({
    title: 'Xác nhận tải file báo cáo',
    content: 'Thời gian tải file có thể tốn vài phút nếu dữ liệu lớn, bạn vẫn mốn tải ?',
    onOk: async () => {
      await FileRadiologyApi.downloadExcel()
    },
  })
}

const handleModalUploadRadiologySuccess = async () => {
  startFetchData({ refetch: true })
  radiologyGroupAll.value = await RadiologyGroupService.list({}, { refetch: true })
}
</script>

<template>
  <ModalRadiologyListSettingScreen
    v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalRadiologyListSettingScreen"
  />
  <ModalRadiologyDetail ref="modalRadiologyDetail" />
  <ModalCopyRadiologySystem
    ref="modalCopyRadiologySystem"
    @success="handleModalCopyRadiologySystemSuccess"
  />
  <ModalRadiologyGroupManager
    ref="modalRadiologyGroupManager"
    @success="handleModalRadiologyGroupManagerSuccess"
  />
  <ModalUploadRadiology ref="modalUploadRadiology" @success="handleModalUploadRadiologySuccess" />
  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
    <div class="">
      <VueButton
        v-if="userPermission[PermissionId.RADIOLOGY_CREATE]"
        color="blue"
        icon="plus"
        @click="router.push({ name: 'RadiologyUpsert' })"
      >
        Thêm mới
      </VueButton>
    </div>
    <div class="ml-auto mr-2 flex items-center gap-8">
      <div v-if="!isMobile">
        <VueButton
          v-if="userPermission[PermissionId.FILE_EXCEL_UPLOAD_RADIOLOGY]"
          :icon="IconUpload"
          @click="modalUploadRadiology?.openModal()"
        >
          Upload
        </VueButton>
      </div>
      <div v-if="!isMobile">
        <VueButton
          v-if="userPermission[PermissionId.FILE_EXCEL_DOWNLOAD_RADIOLOGY]"
          :icon="IconDownload"
          @click="downloadExcelRadiologyList"
        >
          Download
        </VueButton>
      </div>
      <VueButton
        v-if="userPermission[PermissionId.RADIOLOGY_GROUP_CRUD]"
        icon="send"
        color="green"
        @click="modalRadiologyGroupManager?.openModal()"
      >
        Nhóm CĐHA
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
            @click="modalRadiologyListSettingScreen?.openModal()"
          >
            Cài đặt hiển thị
          </a>
          <a
            v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
            @click="modalCopyRadiologySystem?.openModal()"
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
        <div>Chọn nhóm</div>
        <div>
          <VueSelect
            v-model:value="radiologyGroupId"
            :options="[
              { value: 0, text: 'Tất cả' },
              ...radiologyGroupAll.map((group) => ({ value: group.id, text: group.name })),
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
            <th class="cursor-pointer" @click="changeSort('radiologyCode')">
              <div class="flex items-center gap-1 justify-center">
                <span>Mã</span>
                <IconSortChange :sort="sortColumn === 'radiologyCode' ? sortValue : ''" />
              </div>
            </th>
            <th class="cursor-pointer" @click="changeSort('name')">
              <div class="flex items-center gap-1 justify-center">
                <span>Tên</span>
                <IconSortChange :sort="sortColumn === 'name' ? sortValue : ''" />
              </div>
            </th>
            <th>Nhóm</th>
            <th v-if="settingStore.SCREEN_RADIOLOGY_LIST.table.printHtml">Mẫu in</th>
            <th>Giá vốn</th>
            <th class="cursor-pointer" @click="changeSort('price')">
              <div class="flex items-center gap-1 justify-center">
                <span>Giá tiền</span>
                <IconSortChange :sort="sortColumn === 'price' ? sortValue : ''" />
              </div>
            </th>
            <th>Khuyến mại</th>
            <th v-if="userPermission[PermissionId.RADIOLOGY_UPDATE]">Action</th>
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
          <tr v-if="radiologyList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="radiology in radiologyList" :key="radiology.id">
            <td class="text-center" v-if="CONFIG.MODE === 'development'" style="color: violet">
              {{ radiology.id }}
            </td>
            <td class="text-center">{{ radiology.radiologyCode }}</td>
            <td>
              <div class="flex items-center gap-1">
                <span>{{ radiology.name }}</span>
                <a
                  style="line-height: 0"
                  class="text-base"
                  @click="modalRadiologyDetail?.openModal(radiology.id)"
                >
                  <IconFileSearch />
                </a>
              </div>
            </td>
            <td class="text-center">{{ radiologyGroupMap[radiology.radiologyGroupId]?.name }}</td>
            <td v-if="settingStore.SCREEN_RADIOLOGY_LIST.table.printHtml">
              {{ radiology.printHtml?.name }}
            </td>
            <td class="text-right">{{ formatMoney(radiology.costPrice) }}</td>
            <td class="text-right">{{ formatMoney(radiology.price) }}</td>
            <td class="text-center">
              <VueTag
                v-if="
                  radiology.discountApply?.discountMoney || radiology.discountApply?.discountPercent
                "
                color="blue"
              >
                {{ radiology.discountApply?.valueText }}
              </VueTag>
            </td>
            <td v-if="userPermission[PermissionId.RADIOLOGY_UPDATE]" class="text-center">
              <router-link :to="{ name: 'RadiologyUpsert', params: { id: radiology.id } }">
                <IconEditSquare width="20px" height="20px" />
              </router-link>
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
