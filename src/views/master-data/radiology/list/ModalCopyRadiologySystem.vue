<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue'
import { IconClose } from '../../../../common/icon-antd'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputSelect, InputText, VueSelect } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import VueButton from '../../../../common/VueButton.vue'
import VuePagination from '../../../../common/VuePagination.vue'
import { Radiology, RadiologyApi, RadiologyService } from '../../../../modules/radiology'
import { RadiologyGroup, RadiologyGroupApi } from '../../../../modules/radiology-group'
import { arrayToKeyValue, customFilter } from '../../../../utils'

const emit = defineEmits<{ (e: 'success'): void }>()

let radiologySystemAll: Radiology[] = []

const radiologyList = ref<Radiology[]>([])
const radiologyGroupMap = ref<Record<string, RadiologyGroup>>({})
const radiologyGroupOptions = ref<{ value: number; text: string }[]>([])

const searchText = ref('')
const radiologyGroupId = ref(0)

const checkedAll = ref(false)
const radiologyIdSelect = ref<Record<string, boolean>>({})

const showModal = ref(false)
const saveLoading = ref(false)
const page = ref(1)
const limit = ref(10)
const total = ref(0)

const selectedLength = computed(() => {
  return Object.values(radiologyIdSelect.value).filter((i) => !!i).length
})

watchEffect(() => {
  let isCheck = true
  radiologyList.value.forEach((i) => {
    if (!radiologyIdSelect.value[i.id]) {
      isCheck = false
    }
  })
  checkedAll.value = isCheck
})

const startFilterData = () => {
  radiologyList.value = radiologySystemAll
    .filter((i) => {
      if (searchText.value && !customFilter(i.name, searchText.value)) {
        return false
      }
      if (radiologyGroupId.value && i.radiologyGroupId !== radiologyGroupId.value) {
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
  radiologySystemAll = await RadiologyApi.systemList()
  const radiologyGroupList = await RadiologyGroupApi.systemList()
  radiologyGroupMap.value = arrayToKeyValue(radiologyGroupList, 'id')
  radiologyGroupOptions.value = [
    { value: 0, text: 'Tất cả' },
    ...radiologyGroupList.map((i) => {
      return { value: i.id, text: i.name }
    }),
  ]
  total.value = radiologySystemAll.length
  startFilterData()
}

const closeModal = () => {
  showModal.value = false
  radiologyIdSelect.value = {}
}

const handleChangeInput = (e: Event, radiologyId: number) => {
  const target = e.target as HTMLInputElement
  if (target.checked) {
    radiologyIdSelect.value[radiologyId] = true
  } else {
    radiologyIdSelect.value[radiologyId] = false
  }
}

const handleChangeCheckedAll = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.checked) {
    checkedAll.value = true
    radiologyList.value.forEach((i) => {
      radiologyIdSelect.value[i.id] = true
    })
  } else {
    checkedAll.value = false
    radiologyList.value.forEach((i) => {
      radiologyIdSelect.value[i.id] = false
    })
  }
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const radiologyIdList = Object.entries(radiologyIdSelect.value)
      .filter(([key, value]) => !!value)
      .map(([key, value]) => Number(key))
    await RadiologyService.systemCopy({ radiologyIdList })
    emit('success')
    showModal.value = false
    AlertStore.addSuccess('Sao chép thành công')
  } catch (error) {
    console.log('🚀 ~ file: ModalCopyRadiologySystem.vue:124 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 50px">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">
          Danh sách phiếu CĐHA từ hệ thống
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 pb-4 mt-4 modal-data-product-tabs">
        <div class="mt-4 flex flex-wrap gap-4">
          <div style="flex: 2; flex-basis: 400px">
            <div>Lọc theo tên</div>
            <div>
              <InputText v-model:value="searchText" @update:value="startSearch" />
            </div>
          </div>
          <div style="flex: 1; flex-basis: 200px">
            <div>Lọc theo nhóm</div>
            <div>
              <VueSelect
                v-model:value="radiologyGroupId"
                :options="radiologyGroupOptions"
                @update:value="startSearch"
              />
            </div>
          </div>
        </div>

        <div class="mt-4 table-wrapper">
          <table>
            <thead>
              <tr>
                <th style="width: 100px">
                  <input
                    style="cursor: pointer"
                    :checked="checkedAll"
                    type="checkbox"
                    @change="(e) => handleChangeCheckedAll(e)"
                  />
                </th>
                <th>Tên</th>
                <th>Nhóm</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="radiologyList.length === 0">
                <td colspan="20" class="text-center">Không có dữ liệu</td>
              </tr>
              <tr v-for="radiology in radiologyList" :key="radiology.id">
                <td class="text-center">
                  <input
                    style="cursor: pointer"
                    :checked="radiologyIdSelect[radiology.id]"
                    type="checkbox"
                    @change="(e) => handleChangeInput(e, radiology.id)"
                  />
                </td>
                <td>{{ radiology.name }}</td>
                <td>{{ radiologyGroupMap[radiology.radiologyGroupId]?.name }}</td>
              </tr>
            </tbody>
          </table>
          <div class="mt-4 flex gap-4 justify-between mb-2">
            <div>
              Đã chọn
              <span class="font-bold">{{ selectedLength }}</span>
              phiếu
            </div>
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

      <div class="p-4 mt-2 flex justify-center gap-4">
        <VueButton icon="close" @click="closeModal">Hủy bỏ</VueButton>
        <VueButton icon="save" color="blue" :loading="saveLoading" @click="handleSave">
          Sao chép
        </VueButton>
      </div>
    </div>
  </VueModal>
</template>

<style lang="scss" scoped></style>
