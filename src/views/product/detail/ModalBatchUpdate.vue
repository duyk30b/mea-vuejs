<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon'
import { InputDate, InputMoney, InputText } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { Batch, BatchService } from '../../../modules/batch'
import { Product } from '../../../modules/product'

const emit = defineEmits<{ (e: 'success', value: Batch, type: 'UPDATE'): void }>()

const showModal = ref(false)
const batch = ref(Batch.blank())
const saveLoading = ref(false)

const openModal = async (b: Batch) => {
  batch.value = Batch.from(b)
  showModal.value = true
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const batchDraft = await BatchService.updateOne(batch.value.id, batch.value)
    emit('success', batchDraft, 'UPDATE')
    handleClose()
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:30 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleClose = () => {
  batch.value = Batch.blank()
  batch.value.product = Product.blank()
  showModal.value = false
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 600px">
    <form class="bg-white" @submit.prevent="handleSave">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          <span>Thông tin lô hàng</span>
        </div>

        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="handleClose">
          <IconClose />
        </div>
      </div>

      <div class="my-4 px-4">
        <div class="">
          <div>Tên sản phẩm</div>
          <div>
            <InputText :value="batch.product!.brandName" disabled required />
          </div>
        </div>
        <div class="mt-2">
          <div>Hoạt chất</div>
          <div>
            <InputText :value="batch.product!.substance" disabled />
          </div>
        </div>
        <div class="mt-2">
          <div>Số lô</div>
          <div>
            <InputText v-model:value="batch.lotNumber" />
          </div>
        </div>
        <div class="mt-2">
          <div>Hạn sử dụng</div>
          <div>
            <InputDate v-model:value="batch.expiryDate" format="DD/MM/YYYY" type-parser="number" />
          </div>
        </div>
        <div class="mt-2">
          <div>Giá nhập</div>
          <div>
            <InputMoney v-model:value="batch.unitCostPrice" disabled />
          </div>
        </div>
        <div class="mt-2">
          <div>Giá bán sỉ</div>
          <div>
            <InputMoney v-model:value="batch.unitWholesalePrice" />
          </div>
        </div>
        <div class="mt-2">
          <div>Giá bán lẻ</div>
          <div>
            <InputMoney v-model:value="batch.unitRetailPrice" />
          </div>
        </div>
      </div>

      <div class="pb-6 pt-4 px-4">
        <div class="flex gap-4">
          <VueButton class="ml-auto" type="reset" icon="close" @click="handleClose">
            Hủy bỏ
          </VueButton>
          <VueButton color="blue" icon="save" type="submit" :loading="saveLoading">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>
