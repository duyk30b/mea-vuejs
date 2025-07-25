<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose, IconMergeCells } from '../../../common/icon-antd'
import { InputText } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { MeService } from '../../../modules/_me/me.service'
import { BatchApi } from '../../../modules/batch'
import { PermissionId } from '../../../modules/permission/permission.enum'

const emit = defineEmits<{ (e: 'success'): void }>()

const { userPermission } = MeService

let productId: number = 0
const batchIdSource = ref('')
const batchIdTarget = ref('')

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
      batchIdSourceList: batchIdSource.value.split(',').map((i) => Number(i)),
      batchIdTarget: Number(batchIdTarget.value),
    })
    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalBatchMerge.vue:40 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const closeModal = () => {
  productId = 0
  batchIdSource.value = ''
  batchIdTarget.value = ''
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
        <div>
          - Thao tác này
          <b style="color: red">KHÔNG THỂ</b>
          hoàn lại, cần cân nhắc kỹ với thao tác này
        </div>
      </div>

      <div class="my-4 px-4 flex flex-wrap gap-2">
        <div style="flex-basis: 40%; flex-grow: 1; min-width: 250px">
          <div>ID lô hàng nguồn</div>
          <div>
            <InputText
              v-model:value="batchIdSource"
              required
              placeholder="Các ID cách nhau bởi dấu phẩy"
            />
          </div>
        </div>
        <div style="flex-basis: 40%; flex-grow: 1; min-width: 250px">
          <div>ID lô hàng đích</div>
          <div>
            <InputText v-model:value="batchIdTarget" required />
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
            :disabled="!userPermission[PermissionId.PRODUCT_MERGE]"
          >
            <IconMergeCells />
            Gộp lô
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>
