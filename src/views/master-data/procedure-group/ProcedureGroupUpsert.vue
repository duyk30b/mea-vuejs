<script setup lang="ts">
import { CloseOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { InputText } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { ProcedureGroup, ProcedureGroupApi, ProcedureGroupService } from '../../../modules/procedure-group'

const emit = defineEmits<{
  (e: 'success', value: ProcedureGroup, type: 'CREATE' | 'UPDATE' | 'DELETE'): void
}>()

const showModal = ref(false)
const procedureGroup = ref(ProcedureGroup.blank())
const saveLoading = ref(false)

const openModal = async (procedureGroupId?: number) => {
  showModal.value = true
  if (procedureGroupId) {
    procedureGroup.value = await ProcedureGroupApi.detail(procedureGroupId)
  } else {
    procedureGroup.value = ProcedureGroup.blank()
  }
}

const closeModal = () => {
  procedureGroup.value = ProcedureGroup.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (!procedureGroup.value.id) {
      const response = await ProcedureGroupService.createOne(procedureGroup.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await ProcedureGroupService.updateOne(
        procedureGroup.value.id,
        procedureGroup.value
      )
      emit('success', response, 'UPDATE')
    }
    saveLoading.value = false
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ProcedureGroupUpsert.vue:46 ~ handleSave ~ error:', error)
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
          {{ procedureGroup.id ? 'Cập nhật tên nhóm dịch vụ' : 'Tạo tên nhóm dịch vụ mới' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <CloseOutlined />
        </div>
      </div>

      <div class="p-4">
        <div class="">
          <div>Tên</div>
          <div>
            <InputText v-model:value="procedureGroup.name" required />
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
