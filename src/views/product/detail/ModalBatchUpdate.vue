<script setup lang="ts">
import { ref } from 'vue'
import { InputDate, InputMoney } from '../../../common/vue-form'
import { Product } from '../../../modules/product'
import { Batch, useBatchStore } from '../../../modules/batch'

const emit = defineEmits<{ (e: 'success', value: Batch, type: 'UPDATE'): void }>()

const batchStore = useBatchStore()

const showModal = ref(false)
const batch = ref(Batch.blank())
const saveLoading = ref(false)

const openModal = async (p: Product, b: Batch) => {
  const batchDraft = Batch.fromInstance(b)
  batchDraft.product = Product.fromInstance(p)
  batch.value = batchDraft
  showModal.value = true
}

const refreshModal = () => {
  batch.value = Batch.blank()
  batch.value.product = Product.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const batchDraft = await batchStore.updateOne(batch.value.id, batch.value)
    emit('success', batchDraft, 'UPDATE')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:42 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <a-modal
    v-model:visible="showModal"
    width="900px"
    title="Cập nhật thông tin lô hàng"
    :confirm-loading="saveLoading"
    :afterClose="refreshModal"
    @ok="handleSave"
  >
    <div>
      <div class="flex items-center">
        <div style="width: 100px; flex: none">Tên hàng hóa</div>
        <a-input v-model:value="batch.product!.brandName" disabled class="flex-auto" />
      </div>
      <div class="flex items-center mt-2">
        <div style="width: 100px; flex: none">Hoạt chất</div>
        <a-input v-model:value="batch.product!.substance" disabled class="flex-auto" />
      </div>
      <div class="flex items-center mt-2">
        <div style="width: 100px; flex: none">Số lô</div>
        <a-input v-model:value="batch.lotNumber" class="flex-auto" />
      </div>
      <div class="flex items-center mt-2">
        <div style="width: 100px; flex: none">Hạn sử dụng</div>
        <div style="flex: 1">
          <InputDate
            v-model:value="batch.expiryDate"
            format="DD/MM/YYYY"
            type-parser="number"
            class="w-full"
          />
        </div>
      </div>
      <div class="flex items-center mt-2">
        <div style="width: 100px; flex: none">Giá nhập</div>
        <div class="flex-1">
          <InputMoney v-model:value="batch.unitCostPrice" />
        </div>
      </div>
    </div>
  </a-modal>
</template>
