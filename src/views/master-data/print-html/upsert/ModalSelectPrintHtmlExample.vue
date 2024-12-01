<script lang="ts" setup>
import { ref } from 'vue'
import { IconClose } from '../../../../common/icon'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { PrintHtml, PrintHtmlApi, PrintHtmlService } from '../../../../modules/print-html'

const emit = defineEmits<{
  (e: 'select', value: PrintHtml): void
}>()

const showModal = ref(false)
const printHtmlList = ref<PrintHtml[]>([])

const page = ref(1)
const limit = ref(20)
const total = ref(0)

let firstLoad = true

const startFetchData = async () => {
  try {
    printHtmlList.value = await PrintHtmlService.getSystemList()
  } catch (error) {
    console.log('🚀 ~ file: ModalSelectPrintHtmlExample.vue:24 ~ startFetchData ~ error:', error)
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit
  startFetchData()
}

const openModal = async () => {
  showModal.value = true
  if (firstLoad) {
    startFetchData()
    firstLoad = false
  }
}

const closeModal = () => {
  showModal.value = false
}

const selectPrintHtml = (pintHtml: PrintHtml) => {
  emit('select', pintHtml)
  closeModal()
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 100px">
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
                <th>ID</th>
                <th>Tên</th>
                <th style="width: 100px">#</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="printHtmlList.length === 0">
                <td colspan="20" class="text-center">Không có dữ liệu</td>
              </tr>
              <tr v-for="printHtml in printHtmlList" :key="printHtml.id">
                <td class="text-center">P{{ printHtml.id }}</td>
                <td>{{ printHtml.name }}</td>
                <td class="text-center">
                  <a @click="selectPrintHtml(printHtml)">Chọn</a>
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
    </div>
  </VueModal>
</template>

<style lang="scss" scoped></style>
