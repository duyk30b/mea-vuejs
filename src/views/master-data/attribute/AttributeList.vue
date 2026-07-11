<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import VueButton from '@/common/VueButton.vue'
import VuePagination from '@/common/VuePagination.vue'
import { IconEditSquare } from '@/common/icon-google'
import { InputSelect } from '@/common/vue-form'
import { MeService } from '@/modules/_me/me.service.ts'
import { PermissionId } from '@/modules/permission/permission.enum.ts'
import Breadcrumb from '../../component/Breadcrumb.vue'
import { CONFIG } from '@/config'
import { IconBug, IconMergeCells } from '@/common/icon-antd'
import { VueTooltip } from '@/common/popover'
import ModalAttributeUpsert from './ModalAttributeUpsert.vue'
import type { Attribute } from '@/modules/attribute/attribute.model.ts'
import { AttributeApi } from '@/modules/attribute/attribute.api.ts'

const modalAttributeUpsert = ref<InstanceType<typeof ModalAttributeUpsert>>()

const { user } = MeService
const attributeList = ref<Attribute[]>([])

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const dataLoading = ref(false)

const startFetchData = async (options?: { refetch?: boolean }) => {
  try {
    dataLoading.value = true

    const paginationResponse = await AttributeApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: {},
      sort: { key: 'ASC' },
    })

    attributeList.value = paginationResponse.attributeList
    total.value = paginationResponse.total
  } catch (error) {
    console.log('🚀 ~ file: AttributeList.vue:39 ~ startFetchData ~ error:', error)
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
  await startFetchData({ refetch: true })
})

const handleModalAttributeUpsertSuccess = async (data: Attribute) => {
  await startFetchData({ refetch: true })
}
</script>

<template>
  <ModalAttributeUpsert ref="modalAttributeUpsert" @success="handleModalAttributeUpsertSuccess" />
  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
    <div>
      <VueButton
        v-if="user?.oid === 1"
        color="blue"
        icon="plus"
        @click="modalAttributeUpsert?.openModal()"
      >
        Thêm mới
      </VueButton>
    </div>
  </div>

  <div class="mt-4 md:mx-4 p-4 bg-white">
    <div class="mt-4 table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'"></th>
            <th>Key</th>
            <th>Mô tả</th>
            <th>Ví dụ</th>
            <th>#</th>
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
          <tr v-if="attributeList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="attribute in attributeList" :key="attribute.key">
            <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
              <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
                <template #trigger>
                  <IconBug style="color: violet; cursor: pointer" width="1.2em" height="1.2em" />
                </template>
                <pre>{{ JSON.stringify(attribute, null, 4) }}</pre>
              </VueTooltip>
            </td>
            <td class="text-center">{{ attribute.key }}</td>
            <td>{{ attribute.description }}</td>
            <td>{{ attribute.valueExample }}</td>

            <td v-if="user?.oid === 1" class="text-center" style="width: 100px">
              <a
                style="color: var(--text-orange)"
                @click="modalAttributeUpsert?.openModal(attribute)"
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
