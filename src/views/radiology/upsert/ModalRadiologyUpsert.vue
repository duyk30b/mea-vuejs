<script lang="ts" setup>
import { ref } from 'vue'
import { BasicEditor } from '../../../ckeditor/class-editor'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon'
import { InputMoney, InputOptions, InputText, VueSelect } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { Radiology, RadiologyApi } from '../../../modules/radiology'
import { RadiologyGroup, RadiologyGroupService } from '../../../modules/radiology-group'
import { customFilter } from '../../../utils'

const emit = defineEmits<{
  (e: 'success', value: Radiology, type: 'CREATE' | 'UPDATE' | 'DELETE'): void
}>()

const showModal = ref(false)
const radiology = ref(Radiology.blank())
const radiologyExampleOptions = ref<{ value: number; text: string; data: Radiology }[]>([])
const radiologyGroupAll = ref<RadiologyGroup[]>([])
const saveLoading = ref(false)

const openModal = async (instance?: Radiology) => {
  showModal.value = true
  if (instance) {
    radiology.value = Radiology.from(instance)
  } else {
    const exampleList = await RadiologyApi.exampleList()
    radiologyExampleOptions.value = exampleList.map((i) => ({
      value: i.id,
      text: i.name,
      data: i,
    }))
  }
  radiologyGroupAll.value = await RadiologyGroupService.getAll()
}

const closeModal = () => {
  radiology.value = Radiology.blank()
  showModal.value = false
}

const handleInputRadiologyName = (name: string) => {
  radiology.value.name = name

  const groupFilter = radiologyGroupAll.value.find((group) => {
    return customFilter(name, group.name)
  })
  if (groupFilter) {
    radiology.value.radiologyGroupId = groupFilter.id
  }
}

const selectRadiologyExample = (radiologyExample: Radiology) => {
  radiology.value.descriptionDefault = radiologyExample.descriptionDefault
  radiology.value.resultDefault = radiologyExample.resultDefault
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (!radiology.value.id) {
      const response = await RadiologyApi.createOne(radiology.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await RadiologyApi.updateOne(radiology.value.id, radiology.value)
      emit('success', response, 'UPDATE')
    }
    saveLoading.value = false
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalRadiologyUpsert.vue:62 ~ handleSave ~ error:', error)
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <form class="bg-white" @submit.prevent="(e) => handleSave()">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{
            radiology.id ? 'Cập nhật phiếu chẩn đoán hình ảnh' : 'Tạo phiếu chẩn đoán hình ảnh mới'
          }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <div class="">
          <div>Tên phiếu</div>
          <div v-if="radiology.id">
            <InputText v-model:value="radiology.name" required />
          </div>
          <div v-else>
            <InputOptions
              :options="radiologyExampleOptions"
              noClearTextWhenNotSelected
              :message-no-result="false"
              :logic-filter="(item: any, text: string) => customFilter(item?.text, text)"
              @update:text="handleInputRadiologyName"
              @selectItem="({ data }) => selectRadiologyExample(data)" />
          </div>
        </div>
        <div class="mt-3">
          <div class="">Nhóm</div>
          <div>
            <VueSelect
              v-model:value="radiology.radiologyGroupId"
              :options="
                radiologyGroupAll.map((group) => ({ value: group.id, text: group.name }))
              " />
          </div>
        </div>
        <div class="mt-3">
          <div>Giá tiền</div>
          <div style="flex: 1">
            <InputMoney
              v-model:value="radiology.price"
              :validate="{ GTE: 0 }"
              style="width: 100%" />
          </div>
        </div>
        <div class="mt-3">
          <div>Mô tả mặc định</div>
          <div class="description">
            <ckeditor v-model="radiology.descriptionDefault" :editor="BasicEditor"></ckeditor>
          </div>
        </div>
        <div class="mt-3">
          <div>Kết luận mặc định</div>
          <div>
            <InputText v-model:value="radiology.resultDefault" />
          </div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton type="reset" class="ml-auto" icon="close" @click="closeModal">
            Hủy bỏ
          </VueButton>
          <VueButton color="blue" type="submit" :loading="saveLoading" icon="save">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>

<style lang="scss" scoped>
:deep(.description .ck-editor__editable) {
  height: 300px !important;
}
</style>
