<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconFileSearch, IconSetting } from '../../../../common/icon'
import { IconEditSquare, IconLabPanel } from '../../../../common/icon-google'
import { InputText, VueSelect } from '../../../../common/vue-form'
import { CONFIG } from '../../../../config'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { Laboratory, LaboratoryService, LaboratoryValueType } from '../../../../modules/laboratory'
import { LaboratoryGroup, LaboratoryGroupService } from '../../../../modules/laboratory-group'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { arrayToKeyValue } from '../../../../utils'
import ModalLaboratoryDetail from '../detail/ModalLaboratoryDetail.vue'
import ModalLaboratoryUpsert from '../upsert/ModalLaboratoryUpsert.vue'
import ModalCopyLaboratorySystem from './ModalCopyLaboratorySystem.vue'
import ModalLaboratoryGroupManager from './ModalLaboratoryGroupManager.vue'

const modalCopyLaboratoryExample = ref<InstanceType<typeof ModalCopyLaboratorySystem>>()
const modalLaboratoryGroupManager = ref<InstanceType<typeof ModalLaboratoryGroupManager>>()
const modalLaboratoryUpsert = ref<InstanceType<typeof ModalLaboratoryUpsert>>()
const modalLaboratoryDetail = ref<InstanceType<typeof ModalLaboratoryDetail>>()
const meStore = useMeStore()
const settingStore = useSettingStore()
const { formatMoney } = settingStore

const { permissionIdMap } = meStore

const laboratoryList = ref<Laboratory[]>([])
const searchText = ref('')
const laboratoryGroupId = ref<number>(0)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('LABORATORY_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const dataLoading = ref(false)

const laboratoryGroupAll = ref<LaboratoryGroup[]>([])
const laboratoryGroupMap = computed(() => arrayToKeyValue(laboratoryGroupAll.value, 'id'))

const startFetchData = async () => {
  dataLoading.value = true

  try {
    const { data, meta } = await LaboratoryService.pagination({
      page: page.value,
      limit: limit.value,
      relation: { laboratoryGroup: false },
      filter: {
        level: 1,
        laboratoryGroupId: laboratoryGroupId.value ? laboratoryGroupId.value : undefined,
        name: searchText.value ? { LIKE: searchText.value } : undefined,
      },
      sort: { priority: 'ASC' },
    })

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

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'LABORATORY_GROUP_MANAGER') {
    modalLaboratoryGroupManager.value?.openModal()
  }
  if (menu.key === 'COPY_FROM_SYSTEM') {
    modalCopyLaboratoryExample.value?.openModal()
  }
}

const handleModalCopyLaboratorySystemSuccess = async () => {
  await startFetchData()
}

const handleModalLaboratoryGroupManagerSuccess = async () => {
  laboratoryGroupAll.value = await LaboratoryGroupService.list({})
}

const handleModalLaboratoryUpsertSuccess = async () => {
  await startFetchData()
}
</script>

<template>
  <ModalLaboratoryUpsert
    ref="modalLaboratoryUpsert"
    @success="handleModalLaboratoryUpsertSuccess" />
  <ModalCopyLaboratorySystem
    ref="modalCopyLaboratoryExample"
    @success="handleModalCopyLaboratorySystemSuccess" />
  <ModalLaboratoryGroupManager
    ref="modalLaboratoryGroupManager"
    @success="handleModalLaboratoryGroupManagerSuccess" />
  <ModalLaboratoryDetail ref="modalLaboratoryDetail" />
  <div class="mx-4 mt-4 flex justify-between items-center">
    <div class="flex items-center gap-4">
      <div class="hidden md:flex items-center gap-2">
        <IconLabPanel style="font-size: 1.5rem" />
        <span class="font-medium" style="font-size: 1.25rem">Danh sách xét nghiệm</span>
      </div>
      <VueButton
        v-if="permissionIdMap[PermissionId.MASTER_DATA_LABORATORY]"
        color="blue"
        icon="plus"
        @click="modalLaboratoryUpsert?.openModal()">
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
            <a-menu-item key="LABORATORY_GROUP_MANAGER">Quản lý phiếu xét nghiệm</a-menu-item>
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
        <div>Chọn phiếu</div>
        <div>
          <VueSelect
            v-model:value="laboratoryGroupId"
            :options="[
              { value: 0, text: 'Tất cả' },
              ...laboratoryGroupAll.map((group) => ({ value: group.id, text: group.name })),
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
            <th v-if="CONFIG.MODE === 'development'">ID</th>
            <th>Tên</th>
            <th>Phiếu</th>
            <th>Tham chiếu</th>
            <th>Đơn vị</th>
            <th>Giá vốn</th>
            <th>Giá bán</th>
            <th v-if="permissionIdMap[PermissionId.MASTER_DATA_LABORATORY]">Action</th>
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
            <td class="text-center">
              <span>{{ laboratory.priority }}</span>
            </td>
            <td v-if="CONFIG.MODE === 'development'" class="text-center">
              {{ laboratory.id }}
            </td>
            <td>
              <div class="flex items-center">
                {{ laboratory.name }}
                <a class="ml-1" @click="modalLaboratoryDetail?.openModal(laboratory)">
                  <IconFileSearch />
                </a>
              </div>
              <div style="font-style: italic; font-size: 0.9em">
                {{ laboratory.children?.map((i) => i.name).join(', ') }}
              </div>
            </td>
            <td class="text-center">
              {{ laboratoryGroupMap[laboratory.laboratoryGroupId]?.name }}
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
            <td v-if="permissionIdMap[PermissionId.MASTER_DATA_LABORATORY]" class="text-center">
              <a
                style="color: var(--text-orange)"
                @click="modalLaboratoryUpsert?.openModal(laboratory.id)">
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
