<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert'
import {
  InputDate,
  InputMoney,
  InputNumber,
  InputSelect,
  type InputSelectOption,
  InputText,
  VueSelect,
} from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { useSettingStore } from '@/modules/_me/setting.store.ts'
import { PurchaseOrderItem } from '@/modules/purchase-order-item'
import { Warehouse, WarehouseService } from '@/modules/warehouse'
import { onMounted, ref } from 'vue'
import { purchaseOrder } from './purchase-order-upsert.store'

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const purchaseOrderItem = ref<PurchaseOrderItem>(PurchaseOrderItem.blank())
let indexUpdate = 0
const warehouseAll = ref<Warehouse[]>([])
const warehouseOptions = ref<InputSelectOption<Warehouse>[]>([])

const showModal = ref(false)
onMounted(async () => {
  try {
    warehouseAll.value = await WarehouseService.list({})
    warehouseOptions.value = [
      ...warehouseAll.value.map((i) => ({ value: i.id, label: i.name, data: i })),
      { value: 0, label: 'Không chọn kho', data: Warehouse.blank() },
    ]
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})
const openModal = async (purchaseOrderItemIndex: number) => {
  showModal.value = true
  indexUpdate = purchaseOrderItemIndex
  purchaseOrderItem.value = PurchaseOrderItem.from(
    (purchaseOrder.value.purchaseOrderItemList || [])[purchaseOrderItemIndex],
  )
}

const closeModal = () => {
  showModal.value = false
  purchaseOrderItem.value = PurchaseOrderItem.blank()
  indexUpdate = 0
}

const changePurchaseOrderItem = async () => {
  purchaseOrder.value.purchaseOrderItemList![indexUpdate] = PurchaseOrderItem.from(
    purchaseOrderItem.value,
  )
  closeModal()
}

const startRemovePurchaseOrderItem = (_localId: string) => {
  const index = purchaseOrder.value.purchaseOrderItemList!.findIndex((i) => {
    return i._localId === _localId
  })
  purchaseOrder.value.purchaseOrderItemList!.splice(index, 1)
  closeModal()
}

defineExpose({ openModal })
</script>
<template>
  <VueModal v-model:show="showModal" style="width: 800px; margin-top: 50px">
    <div class="bg-white">
      <div class="pl-4 pb-2 pt-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ purchaseOrderItem.product?.brandName }}
        </div>
        <div class="px-4 cursor-pointer" style="font-size: 1.2rem" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <form class="p-4 flex flex-wrap gap-4" @submit.prevent="(e) => changePurchaseOrderItem()">
        <div
          v-if="
            settingStore.SCREEN_PURCHASE_ORDER_UPSERT.purchaseOrderItemsSelect
              .lotNumberAndExpiryDate
          "
          style="flex-basis: 40%; flex-grow: 1; min-width: 300px"
        >
          <div>Số lô</div>
          <div>
            <InputText v-model:value="purchaseOrderItem.lotNumber" class="w-full" />
          </div>
        </div>

        <div
          v-if="
            settingStore.SCREEN_PURCHASE_ORDER_UPSERT.purchaseOrderItemsSelect
              .lotNumberAndExpiryDate
          "
          style="flex-basis: 40%; flex-grow: 1; min-width: 300px"
        >
          <div>Hạn sử dụng</div>
          <div>
            <InputDate
              v-model:value="purchaseOrderItem.expiryDate"
              class="w-full"
              typeParser="number"
            />
          </div>
        </div>

        <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div class="flex gap-2 justify-between">
            <div class="flex gap-1">
              <span>Số lượng</span>
              <span v-if="purchaseOrderItem.unitRate !== 1">
                (
                <b>{{ purchaseOrderItem.quantity }}</b>
                {{ purchaseOrderItem?.product?.unitBasicName }} )
              </span>
            </div>
          </div>
          <div class="flex">
            <div style="width: 120px">
              <InputSelect
                :value="purchaseOrderItem.unitRate"
                :disabled="(purchaseOrderItem.product?.unitObject.length || 0) <= 1"
                :options="
                  purchaseOrderItem.product?.unitObject.map((i) => ({
                    value: i.rate,
                    label: i.name,
                    data: i,
                  })) || []
                "
                @update:value="(v: any) => purchaseOrderItem.changeUnitRate(v)"
                required
              />
            </div>
            <div class="flex-1">
              <InputNumber v-model:value="purchaseOrderItem.unitQuantity" :validate="{ gt: 0 }" />
            </div>
          </div>
        </div>

        <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>
            Giá nhập
            <span v-if="purchaseOrderItem.unitRate !== 1">
              (
              <b>{{ formatMoney(purchaseOrderItem.costPrice) }} /</b>
              {{ purchaseOrderItem?.product?.unitBasicName }})
            </span>
          </div>

          <div style="width: 100%">
            <InputMoney v-model:value="purchaseOrderItem.unitCostPrice" />
          </div>
        </div>

        <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>Nhập vào kho hàng</div>

          <div>
            <InputSelect
              v-model:value="purchaseOrderItem.warehouseId"
              :options="warehouseOptions"
            ></InputSelect>
          </div>
        </div>

        <div class="mt-6 flex gap-4" style="flex-grow: 1; flex-basis: 80%">
          <VueButton
            color="red"
            icon="trash"
            @click="startRemovePurchaseOrderItem(purchaseOrderItem._localId)"
          >
            Xóa
          </VueButton>
          <VueButton icon="close" style="margin-left: auto" type="reset" @click="closeModal">
            Đóng lại
          </VueButton>
          <VueButton color="blue" icon="save" type="submit">Cập nhật</VueButton>
        </div>
      </form>
    </div>
  </VueModal>
</template>
<style lang="scss" scope></style>
