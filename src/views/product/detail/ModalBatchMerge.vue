<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon'
import { IconMergeCells } from '../../../common/icon-antd'
import { InputNumber } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { BatchApi } from '../../../modules/batch'
import { PermissionId } from '../../../modules/permission/permission.enum'

const emit = defineEmits<{ (e: 'success'): void }>()

const meStore = useMeStore()
const { permissionIdMap } = meStore

let productId: number = 0
const batchIdSource = ref(0)
const batchIdTarget = ref(0)

const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async (productIdProp: number) => {
  productId = productIdProp
  showModal.value = true
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    await BatchApi.mergeBatch({
      productId,
      batchIdSource: batchIdSource.value,
      batchIdTarget: batchIdTarget.value,
    })
    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:30 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const closeModal = () => {
  productId = 0
  batchIdSource.value = 0
  batchIdTarget.value = 0
  showModal.value = false
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 600px">
    <form class="bg-white" @submit.prevent="handleSave">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          <span>Gộp lô hàng</span>
        </div>

        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="my-4 px-4">
        <div class="italic underline">Lưu ý:</div>
        <div>
          - Lô hàng nguồn sẽ bị
          <b style="color: red">XÓA</b>
          hoàn toàn khỏi hệ thống
        </div>
        <div>
          - Lô hàng đích sẽ được
          <b>cộng thêm số lượng</b>
          của lô hàng nguồn
        </div>
        <div>
          - Tất cả phiếu nhập hàng và phiếu xuất hàng của lô hàng nguồn đều chuyển sang lô hàng đích
        </div>
        <div>- Thao tác này không thể hoàn lại, cần cân nhắc kỹ với thao tác này</div>
      </div>

      <div class="my-4 px-4 flex flex-wrap gap-2">
        <div style="flex-basis: 40%; flex-grow: 1; min-width: 250px">
          <div>ID lô hàng nguồn</div>
          <div>
            <InputNumber v-model:value="batchIdSource" required :validate="{ GT: 0 }" />
          </div>
        </div>
        <div style="flex-basis: 40%; flex-grow: 1; min-width: 250px">
          <div>ID lô hàng đích</div>
          <div>
            <InputNumber v-model:value="batchIdTarget" required :validate="{ GT: 0 }" />
          </div>
        </div>
      </div>

      <div class="pb-6 pt-6 px-4">
        <div class="flex gap-4">
          <VueButton style="margin-left: auto" type="reset" icon="close" @click="closeModal">
            Hủy bỏ
          </VueButton>
          <VueButton
            color="blue"
            type="submit"
            :loading="saveLoading"
            :disabled="!permissionIdMap[PermissionId.BATCH_MERGE]"
          >
            <IconMergeCells />
            Gộp lô
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>
