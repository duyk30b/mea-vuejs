<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose, IconMergeCells } from '../../../common/icon-antd'
import { InputText } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { MeService } from '../../../modules/_me/me.service'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { ProductApi } from '../../../modules/product'

const emit = defineEmits<{ (e: 'success'): void }>()

const { userPermission } = MeService

let productId: number = 0
const productIdSource = ref('')
const productIdTarget = ref('')

const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async () => {
  showModal.value = true
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    await ProductApi.mergeProduct({
      productIdSourceList: productIdSource.value.split(',').map((i) => Number(i)),
      productIdTarget: Number(productIdTarget.value),
    })
    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalProductMerge.vue:40 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const closeModal = () => {
  productId = 0
  productIdSource.value = ''
  productIdTarget.value = ''
  showModal.value = false
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 600px">
    <form class="bg-white" @submit.prevent="handleSave">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          <span>Gộp sản phẩm</span>
        </div>

        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="my-4 px-4">
        <div class="italic underline">Lưu ý:</div>
        <div>
          - Tất cả Sản phẩm nguồn sẽ bị
          <b style="color: red">XÓA</b>
          hoàn toàn khỏi hệ thống
        </div>
        <div>
          - Sản phẩm đích sẽ được
          <b>cộng thêm số lượng</b>
          của tất cả sản phẩm nguồn
        </div>
        <div>
          - Tất cả phiếu nhập hàng và phiếu xuất hàng và mọi thông tin khác của sản phẩm nguồn đều
          chuyển sang sản phẩm đích
        </div>
        <div>
          - Thao tác này
          <b style="color: red">KHÔNG THỂ</b>
          hoàn lại, cần cân nhắc kỹ với thao tác này
        </div>
      </div>

      <div class="my-4 px-4 flex flex-wrap gap-2">
        <div style="flex-basis: 40%; flex-grow: 1; min-width: 250px">
          <div>ID sản phẩm nguồn</div>
          <div>
            <InputText
              v-model:value="productIdSource"
              required
              placeholder="Các ID cách nhau bởi dấu phẩy"
            />
          </div>
        </div>
        <div style="flex-basis: 40%; flex-grow: 1; min-width: 250px">
          <div>ID sản phẩm đích</div>
          <div>
            <InputText v-model:value="productIdTarget" required />
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
            Gộp sản phẩm
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>
