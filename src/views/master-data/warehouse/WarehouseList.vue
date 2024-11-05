<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import ModalWarehouseUpsert from './ModalWarehouseUpsert.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Warehouse, WarehouseApi } from '../../../modules/warehouse'
import { IconEditSquare, IconWarehouse } from '../../../common/icon-google'
import { PermissionId } from '../../../modules/permission/permission.enum'
import VueButton from '../../../common/VueButton.vue'

const modalWarehouseUpsert = ref<InstanceType<typeof ModalWarehouseUpsert>>()

const meStore = useMeStore()
const settingStore = useSettingStore()
const { formatMoney } = settingStore

const { permissionIdMap } = meStore

const warehouseList = ref<Warehouse[]>([])

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const dataLoading = ref(false)

const startFetchData = async () => {
  try {
    dataLoading.value = true

    const { data, meta } = await WarehouseApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: {},
      filter: {},
      sort: { id: 'ASC' },
    })

    warehouseList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: WarehouseList.vue:39 ~ startFetchData ~ error:', error)
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
  if (options.limit) limit.value = options.limit

  startFetchData()
}

onBeforeMount(async () => {
  await startFetchData()
})

const handleModalWarehouseUpsertSuccess = async (
  data: Warehouse,
  type: 'CREATE' | 'UPDATE' | 'DELETE'
) => {
  await startFetchData()
}
</script>

<template>
  <ModalWarehouseUpsert ref="modalWarehouseUpsert" @success="handleModalWarehouseUpsertSuccess" />

  <div class="mx-4 mt-4 flex justify-between items-center">
    <div class="flex items-center gap-4">
      <div class="hidden md:flex items-center gap-2">
        <IconWarehouse style="font-size: 1.5rem" />
        <span class="font-medium" style="font-size: 1.25rem">Danh sách kho</span>
      </div>
      <VueButton
        v-if="permissionIdMap[PermissionId.MASTER_DATA_WAREHOUSE]"
        color="blue"
        icon="plus"
        @click="modalWarehouseUpsert?.openModal()">
        Thêm mới
      </VueButton>
    </div>
    <div></div>
  </div>
  <div class="mt-4 md:mx-4 p-4 bg-white">
    <div class="mt-4 table-wrapper">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên</th>
            <th></th>
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
          <tr v-if="warehouseList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="warehouse in warehouseList" :key="warehouse.id">
            <td class="text-center">W{{ warehouse.id }}</td>
            <td>{{ warehouse.name }}</td>
            <td v-if="permissionIdMap[PermissionId.MASTER_DATA_WAREHOUSE]" class="text-center">
              <a
                style="color: var(--text-orange)"
                @click="modalWarehouseUpsert?.openModal(warehouse.id)">
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
