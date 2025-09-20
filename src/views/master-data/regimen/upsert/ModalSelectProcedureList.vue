<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue'
import { IconClose } from '@/common/icon-antd'
import { InputSelect, InputText } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import VuePagination from '@/common/VuePagination.vue'
import { Procedure, ProcedureService } from '@/modules/procedure'
import { VueButton } from '@/common'
import { useSettingStore } from '@/modules/_me/setting.store'

const emit = defineEmits<{
  (e: 'selectProcedureList', data: { procedureList: Procedure[] }): void
}>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const showModal = ref(false)
const procedureList = ref<Procedure[]>([])

const searchText = ref('')
const checkedAll = ref(false)
const procedureIdCheckbox = ref<Record<string, Procedure | null>>({})

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const dataLoading = ref(false)

const checkboxLength = computed(() => {
  return Object.values(procedureIdCheckbox.value).filter((i) => !!i).length
})

watchEffect(() => {
  let isCheck = true
  procedureList.value.forEach((i) => {
    if (!procedureIdCheckbox.value[i.id]) {
      isCheck = false
    }
  })
  checkedAll.value = isCheck
})

const startFetchData = async () => {
  const paginationResponse = await ProcedureService.pagination({
    page: page.value,
    limit: limit.value,
    filter: { name: searchText.value ? { LIKE: searchText.value } : undefined },
    sort: { code: 'ASC' },
  })

  procedureList.value = paginationResponse.data
  total.value = paginationResponse.meta.total

  dataLoading.value = false
}

const startSearch = async () => {
  page.value = 1
  await startFetchData()
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
  checkedAll.value = false
  searchText.value = ''
  procedureIdCheckbox.value = {}
  page.value = 1
}

const handleChangeCheckedAll = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.checked) {
    checkedAll.value = true
    procedureList.value.forEach((i) => {
      procedureIdCheckbox.value[i.id] = i
    })
  } else {
    checkedAll.value = false
    procedureList.value.forEach((i) => {
      procedureIdCheckbox.value[i.id] = null
    })
  }
}

const handleChangeCheckboxProcedure = async (checked: boolean, procedureData: Procedure) => {
  if (checked) {
    procedureIdCheckbox.value[procedureData.id] = procedureData
  } else {
    procedureIdCheckbox.value[procedureData.id] = null
  }
}

const handleSave = () => {
  const procedureList = Object.values(procedureIdCheckbox.value).filter((i) => !!i)
  emit('selectProcedureList', { procedureList })
  closeModal()
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 50px">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">Chọn dịch vụ</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 modal-data-product-tabs">
        <div class="mt-4 flex flex-wrap gap-4">
          <div style="flex: 2; flex-basis: 500px">
            <div>Tìm tên dịch vụ</div>
            <div>
              <InputText v-model:value="searchText" @update:value="startSearch" />
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
                <th>Giá</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="procedureList.length === 0">
                <td colspan="20" class="text-center">Không có dữ liệu</td>
              </tr>
              <tr
                v-for="procedure in procedureList"
                :key="procedure.id"
                @click="
                  handleChangeCheckboxProcedure(!procedureIdCheckbox[procedure.id], procedure)
                "
                style="cursor: pointer"
              >
                <td class="text-center">
                  <input
                    style="cursor: pointer"
                    :checked="!!procedureIdCheckbox[procedure.id]"
                    type="checkbox"
                  />
                </td>
                <td>{{ procedure.name }}</td>
                <td>{{ formatMoney(procedure.price) }}</td>
              </tr>
            </tbody>
          </table>

          <div class="mt-4 flex gap-4 justify-between mb-2">
            <div>
              Đã chọn
              <span class="font-bold">{{ checkboxLength }}</span>
              dịch vụ
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
        <VueButton icon="save" color="blue" @click="handleSave">Thêm vào buổi liệu trình</VueButton>
      </div>
    </div>
  </VueModal>
</template>

<style lang="scss" scoped></style>
