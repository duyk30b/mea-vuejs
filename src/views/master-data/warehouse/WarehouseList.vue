<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { IconEditSquare, IconWarehouse } from '../../../common/icon-google'
import VueButton from '../../../common/VueButton.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import type { Warehouse } from '../../../modules/warehouse'
import { WarehouseService } from '../../../modules/warehouse/warehouse.service'
import ModalWarehouseUpsert from './ModalWarehouseUpsert.vue'
import VuePagination from '../../../common/VuePagination.vue'
import { InputSelect } from '../../../common/vue-form'
import Breadcrumb from '../../component/Breadcrumb.vue'

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

    const { data, meta } = await WarehouseService.pagination({
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
  type: 'CREATE' | 'UPDATE' | 'DESTROY',
) => {
  await startFetchData()
}
</script>

<template>
  <ModalWarehouseUpsert ref="modalWarehouseUpsert" @success="handleModalWarehouseUpsertSuccess" />
  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
    <div>
      <VueButton
        v-if="permissionIdMap[PermissionId.MASTER_DATA_WAREHOUSE]"
        color="blue"
        icon="plus"
        @click="modalWarehouseUpsert?.openModal()"
      >
        Thêm mới
      </VueButton>
    </div>
    <div class="ml-auto flex items-center gap-8"></div>
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
            <td class="text-center" style="width: 100px">W{{ warehouse.id }}</td>
            <td>{{ warehouse.name }}</td>
            <td
              v-if="permissionIdMap[PermissionId.MASTER_DATA_WAREHOUSE]"
              class="text-center"
              style="width: 100px"
            >
              <a
                style="color: var(--text-orange)"
                @click="modalWarehouseUpsert?.openModal(warehouse.id)"
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
