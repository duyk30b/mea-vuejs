<script setup lang="ts">
import { computed, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon'
import { InputDate, InputMoney, InputText, VueSelect } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { Batch, BatchService } from '../../../modules/batch'
import { Product } from '../../../modules/product'
import { Warehouse } from '../../../modules/warehouse'
import { WarehouseService } from '../../../modules/warehouse/warehouse.service'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { useMeStore } from '../../../modules/_me/me.store'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'

const emit = defineEmits<{ (e: 'success', value: Batch, type: 'UPDATE' | 'DESTROY'): void }>()

const meStore = useMeStore()
const { permissionIdMap } = meStore

const batchOrigin = ref(Batch.blank())
const batch = ref(Batch.blank())
const warehouseOptions = ref<{ value: number; text: string; data: Warehouse }[]>([])

const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async (batchProp: Batch) => {
  batchOrigin.value = Batch.from(batchProp)
  batch.value = Batch.from(batchProp)
  showModal.value = true

  const warehouseAll = await WarehouseService.list({})

  if (batchProp.product!.warehouseIds === JSON.stringify([0])) {
    warehouseOptions.value = [
      ...warehouseAll.map((i) => ({ value: i.id, text: i.name, data: i })),
      { value: 0, text: 'Không chọn kho', data: Warehouse.blank() },
    ]
  } else {
    warehouseOptions.value = warehouseAll
      .filter((i) => batchProp.product!.warehouseIdList.includes(i.id))
      .map((i) => ({ value: i.id, text: i.name, data: i }))
  }
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (
      batch.value.quantity === batchOrigin.value.quantity &&
      batch.value.costPrice === batchOrigin.value.costPrice
    ) {
      const batchDraft = await BatchService.updateInfo(batch.value.id, batch.value)
      emit('success', batchDraft, 'UPDATE')
    } else {
      const response = await BatchService.updateInfoAndQuantity(batch.value.id, batch.value)
      response.batch.product = response.product
      emit('success', response.batch, 'UPDATE')
    }
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:30 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const hasChangeData = computed(() => {
  return !Batch.equal(batch.value, batchOrigin.value)
})

const closeModal = () => {
  batch.value = Batch.blank()
  batch.value.product = Product.blank()
  showModal.value = false
}

const clickDelete = () => {
  if (batch.value.quantity != 0) {
    return AlertStore.add({
      type: 'error',
      message: 'Không thể xóa lô hàng có số lượng khác 0',
      time: 2000,
    })
  }
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa lô hàng này',
    content: 'Lô hàng đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        const response = await BatchService.destroyOne(batch.value.id)
        if (response.success) {
          emit('success', batch.value, 'DESTROY')
          closeModal()
        } else {
          ModalStore.alert({
            title: 'Không thể xóa lô hàng khi đã tồn tại trong phiếu nhập hàng hoặc phiếu bán hàng',
            content: [
              'Nếu bắt buộc phải xóa, bạn cần phải xóa tất cả phiếu nhập hàng và phiếu bán hàng có lô hàng này',
              `Phiếu nhập hàng đang có: ` + response.data.receiptItemList.map((i) => i.receiptId),
              `Phiếu ban hàng đang có: ` + response.data.ticketProductList.map((i) => i.ticketId),
            ],
          })
        }
      } catch (error) {
        console.log('🚀 ~ file: ModalDistributorUpsert.vue:109 ~ clickDelete ~ error:', error)
      }
    },
  })
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

        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="my-4 px-4 flex flex-wrap gap-2">
        <div style="flex-basis: 90%; flex-grow: 1">
          <div>Tên sản phẩm</div>
          <div>
            <InputText :value="batch.product!.brandName" disabled required />
          </div>
        </div>
        <div style="flex-basis: 40%; flex-grow: 1; min-width: 250px">
          <div>Số lô</div>
          <div>
            <InputText v-model:value="batch.lotNumber" />
          </div>
        </div>
        <div style="flex-basis: 40%; flex-grow: 1; min-width: 250px">
          <div>Hạn sử dụng</div>
          <div>
            <InputDate v-model:value="batch.expiryDate" format="DD/MM/YYYY" type-parser="number" />
          </div>
        </div>
        <div style="flex-basis: 40%; flex-grow: 1; min-width: 250px">
          <div>Số lượng</div>
          <div>
            <InputMoney
              v-model:value="batch.quantity"
              :disabled="!permissionIdMap[PermissionId.BATCH_CHANGE_QUANTITY]" />
          </div>
        </div>
        <div style="flex-basis: 40%; flex-grow: 1; min-width: 250px">
          <div>Giá nhập</div>
          <div>
            <InputMoney
              v-model:value="batch.unitCostPrice"
              :disabled="!permissionIdMap[PermissionId.BATCH_CHANGE_QUANTITY]" />
          </div>
        </div>
        <div style="flex-basis: 90%; flex-grow: 1">
          <div>Kho</div>
          <div>
            <VueSelect v-model:value="batch.warehouseId" :options="warehouseOptions"></VueSelect>
          </div>
        </div>
      </div>

      <div class="pb-6 pt-10 px-4">
        <div class="flex gap-4">
          <VueButton
            v-if="permissionIdMap[PermissionId.BATCH_DELETE] && batch.id"
            color="red"
            type="button"
            @click="clickDelete">
            Xóa
          </VueButton>
          <VueButton class="ml-auto" type="reset" icon="close" @click="closeModal">
            Hủy bỏ
          </VueButton>
          <VueButton
            color="blue"
            icon="save"
            type="submit"
            :loading="saveLoading"
            :disabled="!hasChangeData">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>
