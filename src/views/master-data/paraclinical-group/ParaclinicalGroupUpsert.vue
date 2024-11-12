<script setup lang="ts">
import { CloseOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { InputText } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { ParaclinicalGroup, ParaclinicalGroupApi, ParaclinicalGroupService } from '../../../modules/paraclinical-group'

const emit = defineEmits<{
  (e: 'success', value: ParaclinicalGroup, type: 'CREATE' | 'UPDATE' | 'DELETE'): void
}>()

const showModal = ref(false)
const paraclinicalGroup = ref(ParaclinicalGroup.blank())
const saveLoading = ref(false)

const openModal = async (paraclinicalGroupId?: number) => {
  showModal.value = true
  if (paraclinicalGroupId) {
    paraclinicalGroup.value = await ParaclinicalGroupApi.detail(paraclinicalGroupId)
  } else {
    paraclinicalGroup.value = ParaclinicalGroup.blank()
  }
}

const closeModal = () => {
  paraclinicalGroup.value = ParaclinicalGroup.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (!paraclinicalGroup.value.id) {
      const response = await ParaclinicalGroupService.createOne(paraclinicalGroup.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await ParaclinicalGroupService.updateOne(
        paraclinicalGroup.value.id,
        paraclinicalGroup.value
      )
      emit('success', response, 'UPDATE')
    }
    saveLoading.value = false
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ParaclinicalGroupUpsert.vue:46 ~ handleSave ~ error:', error)
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
          {{ paraclinicalGroup.id ? 'Cập nhật tên nhóm cận lâm sàng' : 'Tạo tên nhóm cận lâm sàng mới' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <CloseOutlined />
        </div>
      </div>

      <div class="p-4">
        <div class="">
          <div>Tên</div>
          <div>
            <InputText v-model:value="paraclinicalGroup.name" required />
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

<style lang="scss" scoped></style>
