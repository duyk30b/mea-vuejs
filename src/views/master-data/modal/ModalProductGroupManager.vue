<script lang="ts" setup>
import { ref } from 'vue'
import { IconClose, IconDelete } from '../../../common/icon-antd'
import { InputText } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import VueButton from '../../../common/VueButton.vue'
import { ProductGroup, ProductGroupService } from '../../../modules/product-group'

const emit = defineEmits<{ (e: 'success'): void }>()

const showModal = ref(false)
const productGroupList = ref<ProductGroup[]>([])
const saveLoading = ref(false)

const startFetchData = async () => {
  try {
    productGroupList.value = await ProductGroupService.list({})
  } catch (error) {
    console.log('🚀 ~ file: ModalProductGroupManager.vue:30 ~ startFetchData ~ error:', error)
  }
}

const openModal = async () => {
  showModal.value = true
  startFetchData()
}

const closeModal = () => {
  showModal.value = false
}

const handleClickAddProductGroup = () => {
  productGroupList.value.push(ProductGroup.blank())
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    await ProductGroupService.replaceAll(productGroupList.value)
    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:42 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 100px">
    <form class="bg-white" @submit.prevent="(e) => handleSave()">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">Quản lý nhóm sản phẩm</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 modal-data-product-tabs">
        <div class="mt-4 table-wrapper" style="overflow-x: visible">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>#</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="productGroupList.length === 0">
                <td colspan="20" class="text-center">Không có dữ liệu</td>
              </tr>
              <tr v-for="(productGroup, index) in productGroupList" :key="productGroup.id">
                <td class="text-center">
                  <span v-if="!!productGroup.id">G{{ productGroup.id }}</span>
                  <span v-if="!productGroup.id"></span>
                </td>
                <td>
                  <InputText
                    v-model:value="productGroup.name"
                    required
                    placeholder="Điền tên nhóm sản phẩm ở đây" />
                </td>
                <td class="text-center">
                  <a style="color: var(--text-red)" @click="productGroupList.splice(index, 1)">
                    <IconDelete />
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="mt-2">
            <VueButton icon="plus" @click="handleClickAddProductGroup">Thêm mới</VueButton>
          </div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton icon="close" style="margin-left:auto" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton icon="save" type="submit" color="blue" :loading="saveLoading">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>

<style lang="scss" scoped></style>
