<script lang="ts" setup>
import { ref } from 'vue'
import { IconClose } from '../../../../common/icon'
import { InputText } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { Radiology, RadiologyService } from '../../../../modules/radiology'
import { customFilter } from '../../../../utils'

const emit = defineEmits<{
  (e: 'select', value: Radiology): void
}>()

const showModal = ref(false)
let radiologyExampleAll: Radiology[] = []
const radiologyExampleList = ref<Radiology[]>([])

const searchText = ref('')

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFilterData = () => {
  radiologyExampleList.value = radiologyExampleAll
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

const openModal = async () => {
  showModal.value = true
  radiologyExampleAll = await RadiologyService.exampleList()
  startFilterData()
}

const closeModal = () => {
  showModal.value = false
}

const selectRadiologyExample = (radiologyExample: Radiology) => {
  emit('select', radiologyExample)
  closeModal()
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 100px">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">Danh sách phiếu CĐHA mẫu</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 modal-data-product-tabs">
        <div class="mt-4 flex flex-wrap gap-4">
          <div style="flex: 2; flex-basis: 500px">
            <div>Tìm tên phiếu CĐHA</div>
            <div>
              <InputText v-model:value="searchText" @update:value="startSearch" />
            </div>
          </div>
        </div>

        <div class="mt-4 table-wrapper">
          <table>
            <thead>
              <tr>
                <th style="width: 100px">#</th>
                <th>Tên</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="radiologyExampleList.length === 0">
                <td colspan="20" class="text-center">Không có dữ liệu</td>
              </tr>
              <tr v-for="radiology in radiologyExampleList" :key="radiology.id">
                <td></td>
                <td>{{ radiology.name }}</td>
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
