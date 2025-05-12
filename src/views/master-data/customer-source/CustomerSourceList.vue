<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { IconSetting } from '../../../common/icon-antd'
import { IconDelete, IconEditSquare } from '../../../common/icon-google'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import VueButton from '../../../common/VueButton.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import {
  CustomerSource,
  CustomerSourceApi,
  CustomerSourceService,
} from '../../../modules/customer-source'
import { PermissionId } from '../../../modules/permission/permission.enum'
import ModalCustomerSourceUpsert from './ModalCustomerSourceUpsert.vue'
import VuePagination from '../../../common/VuePagination.vue'
import { InputSelect } from '../../../common/vue-form'

const modalCustomerSourceUpsert = ref<InstanceType<typeof ModalCustomerSourceUpsert>>()

const meStore = useMeStore()

const { permissionIdMap } = meStore

const customerSourceList = ref<CustomerSource[]>([])

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const dataLoading = ref(false)

const startFetchData = async () => {
  try {
    dataLoading.value = true

    const { data, meta } = await CustomerSourceApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: {},
      filter: {},
      sort: { id: 'ASC' },
    })

    customerSourceList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: CustomerSourceList.vue:39 ~ startFetchData ~ error:', error)
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

const handleModalCustomerSourceUpsertSuccess = async (
  data: CustomerSource,
  type: 'CREATE' | 'UPDATE' | 'DELETE',
) => {
  await startFetchData()
}

const handleClickDeleteCustomerSource = async (id: number, name: string) => {
  ModalStore.confirm({
    title: 'Bạn có chắc muốn xóa dữ liệu này ?',
    content: `Bạn chắc chắn cần xóa bản ghi "${name}" ?`,
    onOk: async () => {
      try {
        await CustomerSourceService.destroyOne(id)
        await startFetchData()
      } catch (error) {
        console.log('🚀 ~ file: CustomerSourceList.vue:79 ~ onOk: ~ error:', error)
      }
    },
  })
}
</script>

<template>
  <ModalCustomerSourceUpsert
    ref="modalCustomerSourceUpsert"
    @success="handleModalCustomerSourceUpsertSuccess"
  />

  <div class="mx-4 mt-4 flex justify-between items-center">
    <div class="flex items-center gap-4">
      <div class="hidden md:flex items-center gap-2">
        <IconSetting style="font-size: 1.5rem" />
        <span class="font-medium" style="font-size: 1.25rem">Danh sách nguồn khách hàng</span>
      </div>
      <VueButton
        v-if="permissionIdMap[PermissionId.MASTER_DATA_WAREHOUSE]"
        color="blue"
        icon="plus"
        @click="modalCustomerSourceUpsert?.openModal()"
      >
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
            <th style="width: 100px">ID</th>
            <th>Tên</th>
            <th style="width: 100px"></th>
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
          <tr v-if="customerSourceList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="customerSource in customerSourceList" :key="customerSource.id">
            <td class="text-center">TS{{ customerSource.id }}</td>
            <td>{{ customerSource.name }}</td>
            <td v-if="permissionIdMap[PermissionId.MASTER_DATA_WAREHOUSE]">
              <div class="flex justify-between">
                <a
                  style="color: var(--text-orange)"
                  @click="modalCustomerSourceUpsert?.openModal(customerSource.id)"
                >
                  <IconEditSquare width="24px" height="24px" />
                </a>
                <a
                  style="color: var(--text-red)"
                  @click="handleClickDeleteCustomerSource(customerSource.id, customerSource.name)"
                >
                  <IconDelete width="24px" height="24px" />
                </a>
              </div>
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
