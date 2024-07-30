<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconFileSearch, IconSetting } from '../../../../common/icon'
import { IconEditSquare, IconPulmonology } from '../../../../common/icon-google'
import { InputText, VueSelect } from '../../../../common/vue-form'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { Radiology, RadiologyService } from '../../../../modules/radiology'
import { RadiologyGroup, RadiologyGroupService } from '../../../../modules/radiology-group'
import { arrayToKeyValue } from '../../../../utils'
import ModalRadiologyDetail from '../detail/ModalRadiologyDetail.vue'
import ModalCopyRadiologySystem from './ModalCopyRadiologySystem.vue'
import ModalRadiologyGroupManager from './ModalRadiologyGroupManager.vue'
import ModalRadiologyListSettingScreen from './ModalRadiologyListSettingScreen.vue'

const modalRadiologyListSettingScreen = ref<InstanceType<typeof ModalRadiologyListSettingScreen>>()
const modalRadiologyDetail = ref<InstanceType<typeof ModalRadiologyDetail>>()
const modalCopyRadiologySystem = ref<InstanceType<typeof ModalCopyRadiologySystem>>()
const modalRadiologyGroupManager = ref<InstanceType<typeof ModalRadiologyGroupManager>>()

const meStore = useMeStore()
const settingStore = useSettingStore()
const { formatMoney } = settingStore

const { permissionIdMap } = meStore

const radiologyList = ref<Radiology[]>([])
const searchText = ref('')
const radiologyGroupId = ref<number>(0)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('RADIOLOGY_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const dataLoading = ref(false)

const radiologyGroupAll = ref<RadiologyGroup[]>([])
const radiologyGroupMap = computed(() => arrayToKeyValue(radiologyGroupAll.value, 'id'))

const startFetchData = async () => {
  dataLoading.value = true
  try {
    const { data, meta } = await RadiologyService.pagination({
      page: page.value,
      limit: limit.value,
      relation: { radiologyGroup: false },
      filter: {
        radiologyGroupId: radiologyGroupId.value ? radiologyGroupId.value : undefined,
        name: searchText.value ? { LIKE: searchText.value } : undefined,
      },
      sort: { priority: 'ASC' },
    })

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

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'RADIOLOGY_GROUP_MANAGER') {
    modalRadiologyGroupManager.value?.openModal()
  }
  if (menu.key === 'SCREEN_SETTING') {
    modalRadiologyListSettingScreen.value?.openModal()
  }
  if (menu.key === 'COPY_FROM_SYSTEM') {
    modalCopyRadiologySystem.value?.openModal()
  }
}

const handleModalRadiologyGroupManagerSuccess = async () => {
  radiologyGroupAll.value = await RadiologyGroupService.list({})
  await startFetchData()
}

const handleModalCopyRadiologySystemSuccess = async () => {
  await startFetchData()
}
</script>

<template>
  <ModalRadiologyListSettingScreen
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalRadiologyListSettingScreen" />
  <ModalRadiologyDetail ref="modalRadiologyDetail" />
  <ModalCopyRadiologySystem
    ref="modalCopyRadiologySystem"
    @success="handleModalCopyRadiologySystemSuccess" />
  <ModalRadiologyGroupManager
    ref="modalRadiologyGroupManager"
    @success="handleModalRadiologyGroupManagerSuccess" />
  <div class="mx-4 mt-4 flex justify-between items-center">
    <div class="flex items-center gap-4">
      <div class="hidden md:flex items-center gap-2">
        <IconPulmonology style="font-size: 1.5rem" />
        <span class="font-medium" style="font-size: 1.25rem">
          Danh sách phiếu chẩn đoán hình ảnh
        </span>
      </div>
      <VueButton
        v-if="permissionIdMap[PermissionId.MASTER_DATA_RADIOLOGY]"
        color="blue"
        icon="plus"
        @click="$router.push({ name: 'RadiologyUpsert' })">
        Thêm mới
      </VueButton>
    </div>
    <div>
      <a-dropdown v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]" trigger="click">
        <span style="font-size: 1.2rem; cursor: pointer">
          <IconSetting />
        </span>
        <template #overlay>
          <a-menu @click="handleMenuSettingClick">
            <a-menu-item key="SCREEN_SETTING">Cài đặt hiển thị</a-menu-item>
            <a-menu-item key="RADIOLOGY_GROUP_MANAGER">Quản lý nhóm CĐHA</a-menu-item>
            <a-menu-item key="COPY_FROM_SYSTEM">Copy dữ liệu từ hệ thống</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
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
            @update:value="startSearch" />
        </div>
      </div>
    </div>
    <div class="mt-4 table-wrapper">
      <table>
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên</th>
            <th>Nhóm</th>
            <th>Giá tiền</th>
            <th>Action</th>
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
            <td class="text-center">{{ radiology.priority }}</td>
            <td>
              <div class="flex items-center gap-1">
                <span>{{ radiology.name }}</span>
                <a
                  style="line-height: 0"
                  class="text-base"
                  @click="modalRadiologyDetail?.openModal(radiology)">
                  <IconFileSearch />
                </a>
              </div>
            </td>
            <td class="text-center">{{ radiologyGroupMap[radiology.radiologyGroupId]?.name }}</td>
            <td class="text-right">{{ formatMoney(radiology.price) }}</td>
            <td v-if="permissionIdMap[PermissionId.MASTER_DATA_RADIOLOGY]" class="text-center">
              <a
                style="color: var(--text-orange)"
                @click="$router.push({ name: 'RadiologyUpsert', params: { id: radiology.id } })">
                <IconEditSquare width="24px" height="24px" />
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
