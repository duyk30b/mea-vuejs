<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon-antd'
import { InputText } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Warehouse } from '../../../modules/warehouse'
import { WarehouseService } from '../../../modules/warehouse/warehouse.service'
import { MeService } from '../../../modules/_me/me.service'

const emit = defineEmits<{
  (e: 'success', value: Warehouse, type: 'CREATE' | 'UPDATE' | 'DESTROY'): void
}>()

const { userPermission } = MeService

const showModal = ref(false)
const warehouse = ref(Warehouse.blank())
const saveLoading = ref(false)

const openModal = async (warehouseId?: number) => {
  showModal.value = true
  if (warehouseId) {
    warehouse.value = await WarehouseService.detail(warehouseId)
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
      const response = await WarehouseService.createOne(warehouse.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await WarehouseService.updateOne(warehouse.value.id, warehouse.value)
      emit('success', response, 'UPDATE')
    }
    saveLoading.value = false
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: WarehouseUpsert.vue:46 ~ handleSave ~ error:', error)
    saveLoading.value = false
  }
}

const clickDelete = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa kho hàng này',
    content: 'Kho hàng đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        const response = await WarehouseService.destroyOne(warehouse.value.id)
        if (response.success) {
          emit('success', warehouse.value, 'DESTROY')
          closeModal()
        } else {
          ModalStore.alert({
            title: 'Không thể xóa kho hàng khi còn tồn tại hàng hóa trong kho',
            content: [
              'Nếu bắt buộc phải xóa, bạn cần phải xóa tất cả sản phẩm và lô hàng của kho hàng này trước',
              `Hiện tại kho hàng này đang có ${response.countBatch} lô hàng liên quan`,
            ],
          })
        }
      } catch (error) {
        console.log('🚀 ~ file: ModalWarehouseUpsert.vue:76 ~ clickDelete ~ error:', error)
      }
    },
  })
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
          <IconClose />
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
          <VueButton
            v-if="userPermission[PermissionId.MASTER_DATA_WAREHOUSE] && warehouse.id"
            color="red"
            @click="clickDelete"
          >
            Xóa
          </VueButton>
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
