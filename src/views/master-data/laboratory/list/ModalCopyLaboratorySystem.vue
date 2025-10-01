<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue'
import { IconClose } from '../../../../common/icon-antd'
import { InputText, VueSelect } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { Laboratory, LaboratoryApi, LaboratoryService } from '../../../../modules/laboratory'
import { LaboratoryGroup, LaboratoryGroupApi } from '../../../../modules/laboratory-group'
import { arrayToKeyValue, customFilter } from '../../../../utils'
import VueButton from '../../../../common/VueButton.vue'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import VuePagination from '../../../../common/VuePagination.vue'

const emit = defineEmits<{ (e: 'success'): void }>()

let laboratorySystemAll: Laboratory[] = []

const laboratoryList = ref<Laboratory[]>([])
const laboratoryGroupMap = ref<Record<string, LaboratoryGroup>>({})
const laboratoryGroupOptions = ref<{ value: number; text: string }[]>([])

const searchText = ref('')
const laboratoryGroupId = ref(0)

const checkedAll = ref(false)
const laboratoryIdSelect = ref<Record<string, boolean>>({})

const showModal = ref(false)
const saveLoading = ref(false)
const page = ref(1)
const limit = ref(10)
const total = ref(0)

const selectedLength = computed(() => {
  return Object.values(laboratoryIdSelect.value).filter((i) => !!i).length
})

watchEffect(() => {
  let isCheck = true
  laboratoryList.value.forEach((i) => {
    if (!laboratoryIdSelect.value[i.id]) {
      isCheck = false
    }
  })
  checkedAll.value = isCheck
})

const startFilterData = () => {
  laboratoryList.value = laboratorySystemAll
    .filter((i) => {
      if (searchText.value && !customFilter(i.name, searchText.value)) {
        return false
      }
      if (laboratoryGroupId.value && i.laboratoryGroupId !== laboratoryGroupId.value) {
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
  const laboratorySystemData = await LaboratoryApi.systemList()
  laboratorySystemAll = laboratorySystemData.filter((i) => i.level === 1)
  const laboratorySystemMap = arrayToKeyValue(laboratorySystemAll, 'id')
  laboratorySystemData.forEach((i) => {
    try {
      i.optionsParse = JSON.parse(i.options)
    } catch (error) {
      i.optionsParse = []
    }
    if (!laboratorySystemMap[i.parentId].children) {
      laboratorySystemMap[i.parentId].children = []
    }
    if (i.level === 2) {
      laboratorySystemMap[i.parentId].children?.push(i)
    }
  })

  const laboratoryGroupList = await LaboratoryGroupApi.systemList()
  laboratoryGroupMap.value = arrayToKeyValue(laboratoryGroupList, 'id')
  laboratoryGroupOptions.value = [
    { value: 0, text: 'Tất cả' },
    ...laboratoryGroupList.map((i) => {
      return { value: i.id, text: i.name }
    }),
  ]
  total.value = laboratorySystemAll.length
  startFilterData()
}

const closeModal = () => {
  showModal.value = false
  laboratoryIdSelect.value = {}
}

const handleChangeInput = (e: Event, laboratoryId: number) => {
  const target = e.target as HTMLInputElement
  if (target.checked) {
    laboratoryIdSelect.value[laboratoryId] = true
  } else {
    laboratoryIdSelect.value[laboratoryId] = false
  }
}

const handleChangeCheckedAll = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.checked) {
    checkedAll.value = true
    laboratoryList.value.forEach((i) => {
      laboratoryIdSelect.value[i.id] = true
    })
  } else {
    checkedAll.value = false
    laboratoryList.value.forEach((i) => {
      laboratoryIdSelect.value[i.id] = false
    })
  }
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const laboratoryIdList = Object.entries(laboratoryIdSelect.value)
      .filter(([key, value]) => !!value)
      .map(([key, value]) => Number(key))
    await LaboratoryService.systemCopy({ laboratoryIdList })
    emit('success')
    AlertStore.addSuccess('Sao chép thành công')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalCopyLaboratorySystem.vue:124 ~ handleSave ~ error:', error)
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
                v-model:value="laboratoryGroupId"
                :options="laboratoryGroupOptions"
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
              <tr v-if="laboratoryList.length === 0">
                <td colspan="20" class="text-center">Không có dữ liệu</td>
              </tr>
              <tr v-for="laboratory in laboratoryList" :key="laboratory.id">
                <td class="text-center">
                  <input
                    style="cursor: pointer"
                    :checked="laboratoryIdSelect[laboratory.id]"
                    type="checkbox"
                    @change="(e) => handleChangeInput(e, laboratory.id)"
                  />
                </td>
                <td>
                  <div>{{ laboratory.name }}</div>
                  <div style="font-style: italic; font-size: 0.9em">
                    {{ laboratory.children?.map((i) => i.name).join(', ') }}
                  </div>
                </td>
                <td>{{ laboratoryGroupMap[laboratory.laboratoryGroupId]?.name }}</td>
              </tr>
            </tbody>
          </table>
          <div class="mt-4 flex justify-between mb-2">
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
