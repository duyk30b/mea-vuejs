<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { IconSetting } from '../../../common/icon'
import { IconDelete, IconEditSquare } from '../../../common/icon-google'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import VueButton from '../../../common/VueButton.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import {
  PrintHtml,
  PrintHtmlApi,
  PrintHtmlType,
  PrintHtmlService,
} from '../../../modules/print-html'

const meStore = useMeStore()

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
      relation: { paraclinical: true },
      filter: { paraclinicalId: 0 },
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

const handleClickDeletePrintHtml = async (id: number, type: keyof typeof PrintHtmlType) => {
  ModalStore.confirm({
    title: 'Bạn có chắc muốn xóa dữ liệu này ?',
    content: `Bạn chắc chắn cần xóa bản ghi "${PrintHtmlType[type]}" ?`,
    onOk: async () => {
      try {
        await PrintHtmlService.destroyOne(id)
        await startFetchData()
      } catch (error) {
        console.log('🚀 ~ file: PrintHtmlList.vue:79 ~ onOk: ~ error:', error)
      }
    },
  })
}
</script>

<template>
  <div class="mx-4 mt-4 flex justify-between items-center">
    <div class="flex items-center gap-4">
      <div class="hidden md:flex items-center gap-2">
        <IconSetting style="font-size: 1.5rem" />
        <span class="font-medium" style="font-size: 1.25rem">Danh sách nhóm cận lâm sàng</span>
      </div>
      <VueButton
        v-if="permissionIdMap[PermissionId.MASTER_DATA_PRINT_HTML]"
        color="blue"
        icon="plus"
        @click="$router.push({ name: 'PrintHtmlUpsert' })">
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
            <th>Loại</th>
            <th>-</th>
            <th>Data</th>
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
            <td class="text-center">G{{ printHtml.id }}</td>
            <td>{{ PrintHtmlType[printHtml.type] }}</td>
            <td>{{ printHtml.paraclinical?.name }}</td>
            <td>{{ printHtml.content.slice(0, 150) }}</td>
            <td v-if="permissionIdMap[PermissionId.MASTER_DATA_PRINT_HTML]">
              <div class="flex justify-between">
                <a
                  style="color: var(--text-orange)"
                  @click="$router.push({ name: 'PrintHtmlUpsert', params: { id: printHtml.id } })">
                  <IconEditSquare width="24px" height="24px" />
                </a>
                <a
                  style="color: var(--text-red)"
                  @click="handleClickDeletePrintHtml(printHtml.id, printHtml.type)">
                  <IconDelete width="24px" height="24px" />
                </a>
              </div>
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
