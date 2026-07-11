<script setup lang="ts">
import { VueButton } from '@/common'
import { IconBug, IconEye } from '@/common/icon-antd'
import { IconSortChange } from '@/common/icon-font-awesome'
import { IconDelete, IconEditSquare } from '@/common/icon-google'
import { VueTooltip } from '@/common/popover'
import { InputSelect } from '@/common/vue-form'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import VuePagination from '@/common/VuePagination.vue'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { PermissionId } from '@/modules/permission/permission.enum'
import {
  TemplateHtmlService,
  TemplateHtmlTypeText,
  type TemplateHtml,
} from '@/modules/template-html'
import Breadcrumb from '@/views/component/Breadcrumb.vue'
import { onBeforeMount, ref } from 'vue'

const { userPermission, user } = MeService

const templateHtmlList = ref<TemplateHtml[]>([])

const sortColumn = ref<'id' | 'priority' | 'templateHtmlType' | 'name' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const dataLoading = ref(false)

const startFetchData = async (options?: { refetch?: boolean }) => {
  try {
    dataLoading.value = true

    const paginationResponse = await TemplateHtmlService.pagination(
      {
        page: page.value,
        limit: limit.value,
        relation: {},
        filter: {},
        sort: sortValue.value
          ? {
              id: sortColumn.value === 'id' ? sortValue.value : undefined,
              priority: sortColumn.value === 'priority' ? sortValue.value : undefined,
              templateHtmlType:
                sortColumn.value === 'templateHtmlType' ? sortValue.value : undefined,
              name: sortColumn.value === 'name' ? sortValue.value : undefined,
            }
          : { priority: 'ASC' },
      },
      { refetch: !!options?.refetch },
    )

    templateHtmlList.value = paginationResponse.templateHtmlList
    total.value = paginationResponse.total
  } catch (error) {
    console.log('🚀 ~ file: TemplateHtmlList.vue:39 ~ startFetchData ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit

  startFetchData()
}

const changeSort = async (column: 'id' | 'priority' | 'templateHtmlType' | 'name') => {
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
  await startFetchData()
}

onBeforeMount(async () => {
  await startFetchData({ refetch: true })
})

const handleClickDeleteTemplateHtml = async (templateHtml: TemplateHtml) => {
  ModalStore.confirm({
    title: 'Bạn có chắc muốn xóa dữ liệu này ?',
    content: `Bạn chắc chắn cần xóa bản ghi "${templateHtml.name}" ?`,
    onOk: async () => {
      try {
        await TemplateHtmlService.destroyOne(templateHtml.id)
        await startFetchData()
      } catch (error) {
        console.log('🚀 ~ file: TemplateHtmlList.vue:79 ~ onOk: ~ error:', error)
      }
    },
  })
}
</script>

<template>
  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
    <div class="">
      <VueButton
        v-if="userPermission[PermissionId.MASTER_DATA_TEMPLATE_HTML]"
        color="blue"
        icon="plus"
        @click="$router.push({ name: 'TemplateHtmlUpsert' })"
      >
        Thêm mới
      </VueButton>
    </div>
  </div>

  <div class="mt-4 md:mx-4 p-4 bg-white">
    <div class="table-wrapper">
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
            <th class="cursor-pointer" @click="changeSort('priority')">
              <div class="flex items-center gap-1 justify-center">
                <span>Mã</span>
                <IconSortChange :sort="sortColumn === 'priority' ? sortValue : ''" />
              </div>
            </th>
            <th class="cursor-pointer" @click="changeSort('name')">
              <div class="flex items-center gap-1 justify-center">
                <span>Tên</span>
                <IconSortChange :sort="sortColumn === 'name' ? sortValue : ''" />
              </div>
            </th>
            <th class="cursor-pointer" @click="changeSort('templateHtmlType')">
              <div class="flex items-center gap-1 justify-center">
                <span>Loại</span>
                <IconSortChange :sort="sortColumn === 'templateHtmlType' ? sortValue : ''" />
              </div>
            </th>
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
          <tr v-if="templateHtmlList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="templateHtml in templateHtmlList" :key="templateHtml.id">
            <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
              <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
                <template #trigger>
                  <IconBug style="color: violet; cursor: pointer" width="1.2em" height="1.2em" />
                </template>
                <pre>{{ JSON.stringify(templateHtml, null, 4) }}</pre>
              </VueTooltip>
            </td>
            <td class="text-center">{{ templateHtml.priority }}</td>
            <td>{{ templateHtml.name }}</td>
            <td>
              <span>{{ TemplateHtmlTypeText[templateHtml.templateHtmlType] }}</span>
              <span v-if="CONFIG.MODE == 'development'" style="color: violet; margin-left: 4px">({{ templateHtml.templateHtmlType }})</span>
            </td>
            <td>
              <div
                v-if="userPermission[PermissionId.MASTER_DATA_TEMPLATE_HTML]"
                class="flex justify-between"
              >
                <router-link :to="{ name: 'TemplateHtmlUpsert', params: { id: templateHtml.id } }">
                  <IconEditSquare
                    v-if="templateHtml.oid !== 1 || user?.id === 1"
                    width="20px"
                    height="20px"
                    style="color: var(--text-orange)"
                  />
                  <IconEye v-else width="20px" height="20px" />
                </router-link>
                <span>
                  <a
                    v-if="templateHtml.oid !== 1 || user?.id === 1"
                    style="color: var(--text-red)"
                    @click="handleClickDeleteTemplateHtml(templateHtml)"
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
  </div>
</template>
