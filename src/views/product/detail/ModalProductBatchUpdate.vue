<script setup lang="ts">
import { InputDate, InputMoney, InputNumber } from '@/common/vue-form'
import { Product, ProductBatch, ProductBatchApi } from '@/modules/product'
import { useProductStore } from '@/modules/product/product.store'
import { ref } from 'vue'

const emit = defineEmits<{ (e: 'success', value: ProductBatch, type: 'UPDATE'): void }>()

const productStore = useProductStore()

const showModal = ref(false)
const productBatch = ref(ProductBatch.blank())
const saveLoading = ref(false)

const openModal = async (p: Product, b: ProductBatch) => {
  const batch = ProductBatch.fromInstance(b)
  batch.product = Product.fromInstance(p)
  productBatch.value = batch
  showModal.value = true
}

const refreshModal = () => {
  productBatch.value = ProductBatch.blank()
  productBatch.value.product = Product.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const batch = await ProductBatchApi.updateOne(productBatch.value.id!, productBatch.value)
    emit('success', batch, 'UPDATE')
    productStore.updateProductBatch(batch)
    productStore.timeSync = Date.now() // tạo trigger để màn list reload lại
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
    title="Cập nhật lô hàng sản phẩm"
    :confirm-loading="saveLoading"
    :afterClose="refreshModal"
    @ok="handleSave"
  >
    <div>
      <div class="flex items-center">
        <div style="width: 100px; flex: none">Tên hàng hóa</div>
        <a-input v-model:value="productBatch.product!.brandName" disabled class="flex-auto" />
      </div>
      <div class="flex items-center mt-2">
        <div style="width: 100px; flex: none">Hoạt chất</div>
        <a-input v-model:value="productBatch.product!.substance" disabled class="flex-auto" />
      </div>
      <div class="flex items-center mt-2">
        <div style="width: 100px; flex: none">Số lô</div>
        <a-input v-model:value="productBatch.batch" class="flex-auto" />
      </div>
      <div class="flex items-center mt-2">
        <div style="width: 100px; flex: none">Hạn sử dụng</div>
        <div style="flex: 1">
          <InputDate
            v-model:value="productBatch.expiryDate"
            format="DD/MM/YYYY"
            type-parser="number"
            class="w-full"
          />
        </div>
      </div>
      <div class="flex items-center mt-2">
        <div style="width: 100px; flex: none">Giá nhập</div>
        <div class="flex-1">
          <InputMoney :value="productBatch.unitCostPrice" disabled />
        </div>
      </div>
      <div class="flex items-center mt-2">
        <div style="width: 100px; flex: none">Giá bán sỉ</div>
        <div class="flex-1">
          <InputMoney v-model:value="productBatch.unitWholesalePrice" />
        </div>
      </div>
      <div class="flex items-center mt-2">
        <div style="width: 100px; flex: none">Giá bán lẻ</div>
        <div class="flex-1">
          <InputMoney v-model:value="productBatch.unitRetailPrice" />
        </div>
      </div>
      <div class="flex items-center mt-4">
        <div class="w-[100px] flex-none">Active</div>
        <a-switch
          :checked="Boolean(productBatch.isActive)"
          @change="(checked: Boolean) => (productBatch.isActive = checked ? 1 : 0)"
        />
      </div>
    </div>
  </a-modal>
</template>
