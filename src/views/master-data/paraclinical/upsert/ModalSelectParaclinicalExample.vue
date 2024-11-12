<script lang="ts" setup>
import { ref } from 'vue'
import { BasicEditor } from '../../../../ckeditor/class-editor'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose } from '../../../../common/icon'
import { InputMoney, InputOptions, InputText, VueSelect } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import {
  Paraclinical,
  ParaclinicalApi,
  ParaclinicalService,
} from '../../../../modules/paraclinical'
import { ParaclinicalGroup, ParaclinicalGroupService } from '../../../../modules/paraclinical-group'
import { customFilter } from '../../../../utils'

const emit = defineEmits<{
  (e: 'select', value: Paraclinical): void
}>()

const showModal = ref(false)
let paraclinicalExampleAll: Paraclinical[] = []
const paraclinicalExampleList = ref<Paraclinical[]>([])

const searchText = ref('')

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFilterData = () => {
  paraclinicalExampleList.value = paraclinicalExampleAll
    .filter((i) => customFilter(i.name, searchText.value))
    .slice((page.value - 1) * limit.value, page.value * limit.value)
}

const startSearch = async () => {
  page.value = 1
  startFilterData()
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit
  startFilterData()
}

const openModal = async (instance?: Paraclinical) => {
  showModal.value = true
  paraclinicalExampleAll = await ParaclinicalService.exampleList()
  startFilterData()
}

const closeModal = () => {
  showModal.value = false
}

const selectParaclinicalExample = (paraclinicalExample: Paraclinical) => {
  emit('select', paraclinicalExample)
  closeModal()
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 100px">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">Dữ liệu mẫu</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 modal-data-product-tabs">
        <div class="mt-4 flex flex-wrap gap-4">
          <div style="flex: 2; flex-basis: 500px">
            <div>Tìm tên phiếu cận lâm sàng</div>
            <div>
              <InputText v-model:value="searchText" @update:value="startSearch" />
            </div>
          </div>
        </div>

        <div class="mt-4 table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tên</th>
                <th style="width: 100px">#</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paraclinicalExampleList.length === 0">
                <td colspan="20" class="text-center">Không có dữ liệu</td>
              </tr>
              <tr v-for="paraclinical in paraclinicalExampleList" :key="paraclinical.id">
                <td>{{ paraclinical.name }}</td>
                <td class="text-center">
                  <a @click="selectParaclinicalExample(paraclinical)">Chọn</a>
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

<style lang="scss" scoped>
:deep(.description .ck-editor__editable) {
  height: 300px !important;
}
</style>
