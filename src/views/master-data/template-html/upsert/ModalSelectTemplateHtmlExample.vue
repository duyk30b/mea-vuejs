<script lang="ts" setup>
import { ref } from 'vue'
import VuePagination from '@/common/VuePagination.vue'
import { IconClose } from '@/common/icon-antd/index.ts'
import { InputSelect } from '@/common/vue-form/index.ts'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { TemplateHtml, TemplateHtmlApi, TemplateHtmlService } from '@/modules/template-html'
import { CONFIG } from '@/config'

const emit = defineEmits<{
  (e: 'select', value: TemplateHtml): void
}>()

const showModal = ref(false)
const templateHtmlList = ref<TemplateHtml[]>([])

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const paginationResponse = await TemplateHtmlService.pagination({
      filter: { oid: 1 },
      sort: { priority: 'ASC' },
      page: page.value,
      limit: limit.value,
    })
    templateHtmlList.value = paginationResponse.templateHtmlList
    total.value = paginationResponse.total
  } catch (error) {
    console.log('🚀 ~ file: ModalSelectTemplateHtmlExample.vue:24 ~ startFetchData ~ error:', error)
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit
  startFetchData()
}

const openModal = async () => {
  showModal.value = true
  startFetchData()
}

const closeModal = () => {
  showModal.value = false
  templateHtmlList.value = []
}

const selectTemplateHtml = (templateHtml: TemplateHtml) => {
  emit('select', templateHtml)
  closeModal()
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 50px">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">Chọn mẫu in Demo</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 modal-data-product-tabs">
        <div class="mt-4 table-wrapper">
          <table>
            <thead>
              <tr>
                <th v-if="CONFIG.MODE === 'development'">ID</th>
                <th>STT</th>
                <th>Tên</th>
                <th style="width: 100px">#</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="templateHtmlList.length === 0">
                <td colspan="20" class="text-center">Không có dữ liệu</td>
              </tr>
              <tr v-for="templateHtml in templateHtmlList" :key="templateHtml.id">
                <td v-if="CONFIG.MODE === 'development'" class="text-center" style="color: violet">
                  {{ templateHtml.id }}
                </td>
                <td class="text-center">{{ templateHtml.priority }}</td>
                <td>{{ templateHtml.name }}</td>
                <td class="text-center">
                  <a @click="selectTemplateHtml(templateHtml)">Chọn</a>
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
    </div>
  </VueModal>
</template>

<style lang="scss" scoped></style>
