<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon-antd'
import { InputText } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import {
  CustomerSource,
  CustomerSourceApi,
  CustomerSourceService,
} from '../../../modules/customer-source'

const emit = defineEmits<{
  (e: 'success', value: CustomerSource, type: 'CREATE' | 'UPDATE' | 'DELETE'): void
}>()

const showModal = ref(false)
const customerSource = ref(CustomerSource.blank())
const saveLoading = ref(false)

const openModal = async (customerSourceId?: number) => {
  showModal.value = true
  if (customerSourceId) {
    customerSource.value = await CustomerSourceApi.detail(customerSourceId)
  } else {
    customerSource.value = CustomerSource.blank()
  }
}

const closeModal = () => {
  customerSource.value = CustomerSource.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (!customerSource.value.id) {
      const response = await CustomerSourceService.createOne(customerSource.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await CustomerSourceService.updateOne(
        customerSource.value.id,
        customerSource.value,
      )
      emit('success', response, 'UPDATE')
    }
    saveLoading.value = false
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: CustomerSourceUpsert.vue:46 ~ handleSave ~ error:', error)
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
          {{ customerSource.id ? 'Cập nhật nguồn khách hàng' : 'Tạo nguồn khách hàng mới' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <div class="">
          <div>Tên</div>
          <div>
            <InputText v-model:value="customerSource.name" required />
          </div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton type="reset" style="margin-left: auto" icon="close" @click="closeModal">
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
