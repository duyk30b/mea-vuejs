<script setup lang="ts">
import { CloseOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { InputText } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { Warehouse, WarehouseApi } from '../../../modules/warehouse'

const emit = defineEmits<{
  (e: 'success', value: Warehouse, type: 'CREATE' | 'UPDATE' | 'DELETE'): void
}>()

const showModal = ref(false)
const warehouse = ref(Warehouse.blank())
const saveLoading = ref(false)

const openModal = async (warehouseId?: number) => {
  showModal.value = true
  if (warehouseId) {
    warehouse.value = await WarehouseApi.detail(warehouseId)
  } else {
    warehouse.value = Warehouse.blank()
  }
}

const closeModal = () => {
  warehouse.value = Warehouse.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (!warehouse.value.id) {
      const response = await WarehouseApi.createOne(warehouse.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await WarehouseApi.updateOne(warehouse.value.id, warehouse.value)
      emit('success', response, 'UPDATE')
    }
    saveLoading.value = false
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: WarehouseUpsert.vue:46 ~ handleSave ~ error:', error)
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
          {{ warehouse.id ? 'Cập nhật kho hàng' : 'Tạo kho hàng mới' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <CloseOutlined />
        </div>
      </div>

      <div class="p-4">
        <div class="">
          <div>Tên kho</div>
          <div>
            <InputText v-model:value="warehouse.name" required />
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
