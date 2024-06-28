<script setup lang="ts">
import { CloseOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import { BasicEditor } from '../../../ckeditor/class-editor'
import VueButton from '../../../common/VueButton.vue'
import VueModal from '../../../common/VueModal.vue'
import { InputMoney, InputText } from '../../../common/vue-form'
import { Radiology, RadiologyApi } from '../../../modules/radiology'

const emit = defineEmits<{
  (e: 'success', value: Radiology, type: 'CREATE' | 'UPDATE' | 'DELETE'): void
}>()

const showModal = ref(false)
const radiology = ref(Radiology.blank())
const saveLoading = ref(false)

const openModal = async (instance?: Radiology) => {
  showModal.value = true
  if (instance) {
    radiology.value = Radiology.toBasic(instance)
  }
}

const closeModal = () => {
  radiology.value = Radiology.blank()
  showModal.value = false
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
    console.log('🚀 ~ file: ModalProcedureUpsert.vue:73 ~ handleSave ~ error:', error)
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
          <CloseOutlined />
        </div>
      </div>

      <div class="p-4">
        <div class="">
          <div>Tên phiếu</div>
          <div>
            <InputText v-model:value="radiology.name" required />
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
          <div>Mô tả ban đầu</div>
          <div class="description">
            <ckeditor v-model="radiology.default" :editor="BasicEditor"></ckeditor>
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
