<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import VueButton from '../../common/VueButton.vue'
import { IconEditSquare, IconPulmonology } from '../../common/icon-google'
import { InputText } from '../../common/vue-form'
import { useMeStore } from '../../modules/_me/me.store'
import { useSettingStore } from '../../modules/_me/setting.store'
import { PermissionId } from '../../modules/permission/permission.enum'
import { Radiology, RadiologyApi } from '../../modules/radiology'
import { customFilter } from '../../utils'
import ModalRadiologyUpsert from './upsert/ModalRadiologyUpsert.vue'

const modalRadiologyUpsert = ref<InstanceType<typeof ModalRadiologyUpsert>>()

const meStore = useMeStore()
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const { permissionIdMap } = meStore

let radiologyAll: Radiology[] = []
const radiologyList = ref<Radiology[]>([])
const searchText = ref('')

const page = ref(1)
const limit = ref(Number(localStorage.getItem('RADIOLOGY_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const dataLoading = ref(false)

const startFilterData = () => {
  radiologyList.value = radiologyAll
    .filter((i) => {
      if (!searchText.value) return true
      return customFilter(i.name, searchText.value)
    })
    .slice((page.value - 1) * limit.value, page.value * limit.value)
}

const startSearch = async () => {
  page.value = 1
  startFilterData()
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  console.log('🚀 ~ changePagination ~ options:', options)
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
    console.log('🚀 ~ file: ProcedureList.vue:61 ~ error:', error)
  }
}

onBeforeMount(async () => {
  dataLoading.value = true
  await startFetchData()
  startFilterData()
  dataLoading.value = false
})

const handleModalRadiologyUpsertSuccess = async (
  data: Radiology,
  type: 'CREATE' | 'UPDATE' | 'DELETE'
) => {
  await startFetchData()
  startFilterData()
}
</script>

<template>
  <ModalRadiologyUpsert ref="modalRadiologyUpsert" @success="handleModalRadiologyUpsertSuccess" />
  <div class="mx-4 mt-4 flex justify-between items-center">
    <div class="flex items-center gap-4">
      <div class="hidden md:flex items-center gap-2">
        <IconPulmonology style="font-size: 1.5rem" />
        <span class="font-medium" style="font-size: 1.25rem">
          Danh sách phiếu chẩn đoán hình ảnh
        </span>
      </div>
      <VueButton
        v-if="permissionIdMap[PermissionId.RADIOLOGY_CREATE]"
        color="blue"
        icon="plus"
        @click="modalRadiologyUpsert?.openModal()">
        Thêm mới
      </VueButton>
    </div>
    <div>
      <!-- Icon drop down setting -->
    </div>
  </div>
  <div class="mt-4 md:mx-4 p-4 bg-white">
    <div class="flex-flex-wrap gap-4">
      <div style="flex: 2; flex-basis: 500px">
        <div>Tìm kiếm</div>
        <div>
          <InputText v-model:value="searchText" @update:value="startSearch" />
        </div>
      </div>
    </div>
    <div class="mt-4 table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Mã</th>
            <th>Tên</th>
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
            <td>{{ radiology.name }}</td>
            <td class="text-right">{{ formatMoney(radiology.price) }}</td>
            <td v-if="permissionIdMap[PermissionId.RADIOLOGY_UPDATE]" class="text-center">
              <a
                style="color: var(--text-orange)"
                @click="modalRadiologyUpsert?.openModal(radiology)">
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
