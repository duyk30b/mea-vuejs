<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { IconEye } from '../../../common/icon-antd'
import { IconDelete, IconEditSquare } from '../../../common/icon-google'
import { InputSelect } from '../../../common/vue-form'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import VuePagination from '../../../common/VuePagination.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { PrintHtml, PrintHtmlApi, PrintHtmlService } from '../../../modules/print-html'
import { VueButton } from '../../../common'

const meStore = useMeStore()
const { user } = meStore

const { permissionIdMap } = meStore

const printHtmlList = ref<PrintHtml[]>([])

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const dataLoading = ref(false)

const startFetchData = async () => {
  try {
    dataLoading.value = true

    const { data, meta } = await PrintHtmlApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: {},
      filter: {},
      sort: { id: 'ASC' },
    })

    printHtmlList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: PrintHtmlList.vue:39 ~ startFetchData ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit

  startFetchData()
}

onBeforeMount(async () => {
  await startFetchData()
})

const handleClickDeletePrintHtml = async (printHtml: PrintHtml) => {
  ModalStore.confirm({
    title: 'Bạn có chắc muốn xóa dữ liệu này ?',
    content: `Bạn chắc chắn cần xóa bản ghi "${printHtml.name}" ?`,
    onOk: async () => {
      try {
        await PrintHtmlService.destroyOne(printHtml.id)
        await startFetchData()
      } catch (error) {
        console.log('🚀 ~ file: PrintHtmlList.vue:79 ~ onOk: ~ error:', error)
      }
    },
  })
}
</script>

<template>
  <div class="mt-4 flex justify-end">
    <VueButton
      v-if="permissionIdMap[PermissionId.MASTER_DATA_PRINT_HTML]"
      color="blue"
      icon="plus"
      @click="$router.push({ name: 'PrintHtmlUpsert' })"
    >
      Thêm mới
    </VueButton>
  </div>

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
        <tr v-if="printHtmlList.length === 0">
          <td colspan="20" class="text-center">Không có dữ liệu</td>
        </tr>
        <tr v-for="printHtml in printHtmlList" :key="printHtml.id">
          <td class="text-center">P{{ printHtml.id }}</td>
          <td>{{ printHtml.name }}</td>
          <td v-if="permissionIdMap[PermissionId.MASTER_DATA_PRINT_HTML]">
            <div class="flex justify-between">
              <router-link :to="{ name: 'PrintHtmlUpsert', params: { id: printHtml.id } }">
                <IconEditSquare
                  v-if="printHtml.oid !== 1 || user?.id === 1"
                  width="20px"
                  height="20px"
                  style="color: var(--text-orange)"
                />
                <IconEye v-else width="20px" height="20px" />
              </router-link>
              <span>
                <a
                  v-if="printHtml.oid !== 1 || user?.id === 1"
                  style="color: var(--text-red)"
                  @click="handleClickDeletePrintHtml(printHtml)"
                >
                  <IconDelete width="20px" height="20px" />
                </a>
              </span>
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
</template>
