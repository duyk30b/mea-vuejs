<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconFileSearch } from '../../../common/icon'
import { IconEditSquare, IconPulmonology } from '../../../common/icon-google'
import { InputText, VueSelect } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Radiology, RadiologyApi } from '../../../modules/radiology'
import { RadiologyGroup, RadiologyGroupService } from '../../../modules/radiology-group'
import { arrayToKeyValue, customFilter } from '../../../utils'
import ModalRadiologyDetail from './detail/ModalRadiologyDetail.vue'

const modalRadiologyDetail = ref<InstanceType<typeof ModalRadiologyDetail>>()

const meStore = useMeStore()
const settingStore = useSettingStore()
const { formatMoney } = settingStore

const { permissionIdMap } = meStore

let radiologyAll: Radiology[] = []
const radiologyList = ref<Radiology[]>([])
const radiologyGroupAll = ref<RadiologyGroup[]>([])
const searchText = ref('')
const radiologyGroupId = ref<number>(0)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('RADIOLOGY_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const dataLoading = ref(false)

const radiologyGroupMap = computed(() => arrayToKeyValue(radiologyGroupAll.value, 'id'))

const startFilterData = () => {
  radiologyList.value = radiologyAll
    .filter((i) => {
      if (searchText.value && !customFilter(i.name, searchText.value)) {
        return false
      }
      if (radiologyGroupId.value && i.radiologyGroupId !== radiologyGroupId.value) {
        return false
      }
      return true
    })
    .slice((page.value - 1) * limit.value, page.value * limit.value)
}

const startSearch = async () => {
  page.value = 1
  startFilterData()
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('RADIOLOGY_PAGINATION_LIMIT', String(options.limit))
  }
  startFilterData()
}

const startFetchData = async () => {
  try {
    const response = await RadiologyApi.list({
      sort: { id: 'DESC' },
    })
    radiologyAll = response.data
    total.value = radiologyAll.length
  } catch (error) {
    console.log('🚀 ~ file: RadiologyList.vue:63 ~ startFetchData ~ error:', error)
  }
}

onBeforeMount(async () => {
  dataLoading.value = true
  await startFetchData()
  startFilterData()
  dataLoading.value = false
  try {
    radiologyGroupAll.value = await RadiologyGroupService.getAll()
  } catch (error) {
    console.log('🚀 ~ file: RadiologyList.vue:86 ~ onBeforeMount ~ error:', error)
  }
})

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    // modalRadiologyListSettingScreen.value?.openModal()
  }
}
</script>

<template>
  <ModalRadiologyDetail ref="modalRadiologyDetail" />
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
      <!-- <a-dropdown v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]" trigger="click">
        <span style="font-size: 1.2rem; cursor: pointer">
          <IconSetting />
        </span>
        <template #overlay>
          <a-menu @click="handleMenuSettingClick">
            <a-menu-item key="screen-setting">Cài đặt hiển thị</a-menu-item>
            <a-menu-item key="data-setting">Cài đặt dữ liệu</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown> -->
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
            <th>Mã</th>
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
            <td class="text-center">R{{ radiology.id }}</td>
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
