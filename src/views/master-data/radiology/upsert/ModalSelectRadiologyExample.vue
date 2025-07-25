<script lang="ts" setup>
import { ref } from 'vue'
import { IconClose } from '../../../../common/icon-antd'
import { InputText } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import VuePagination from '../../../../common/VuePagination.vue'
import { Radiology, RadiologyApi } from '../../../../modules/radiology'
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
    .filter((i) => {
      if (searchText.value && !customFilter(i.name, searchText.value)) {
        return false
      }
      return true
    })
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
  radiologyExampleAll = await RadiologyApi.systemList()
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
  <VueModal v-model:show="showModal" style="margin-top: 50px">
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
                <th>Tên</th>
                <th style="width: 100px">#</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="radiologyExampleList.length === 0">
                <td colspan="20" class="text-center">Không có dữ liệu</td>
              </tr>
              <tr v-for="radiology in radiologyExampleList" :key="radiology.id">
                <td>{{ radiology.name }}</td>
                <td class="text-center">
                  <a @click="selectRadiologyExample(radiology)">Chọn</a>
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
        </div>
      </div>
    </div>
  </VueModal>
</template>

<style lang="scss" scoped></style>
