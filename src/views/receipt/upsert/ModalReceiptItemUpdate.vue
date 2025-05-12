<script lang="ts" setup>
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon-antd'
import { InputDate, InputMoney, InputNumber, InputText, VueSelect } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { ReceiptItem } from '../../../modules/receipt-item'
import { receipt } from './receipt-upsert.store'

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const receiptItem = ref<ReceiptItem>(ReceiptItem.blank())
let indexUpdate = 0

const showModal = ref(false)

const openModal = async (receiptItemIndex: number) => {
  showModal.value = true
  indexUpdate = receiptItemIndex
  receiptItem.value = ReceiptItem.from((receipt.value.receiptItemList || [])[receiptItemIndex])
}

const closeModal = () => {
  showModal.value = false
  receiptItem.value = ReceiptItem.blank()
  indexUpdate = 0
}

const clickDestroy = async () => {
  receipt.value.receiptItemList?.splice(indexUpdate, 1)
  closeModal()
}

const changeReceiptItem = async () => {
  receipt.value.receiptItemList![indexUpdate] = ReceiptItem.from(receiptItem.value)
  closeModal()
}

defineExpose({ openModal })
</script>
<template>
  <VueModal v-model:show="showModal" style="width: 800px; margin-top: 100px">
    <div class="bg-white">
      <div class="pl-4 pb-2 pt-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ receiptItem.product?.brandName }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <form class="p-4 flex flex-wrap gap-4" @submit.prevent="(e) => changeReceiptItem()">
        <div
          v-if="settingStore.SCREEN_RECEIPT_UPSERT.receiptItemsSelect.batchCodeAndExpiryDate"
          style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>Số lô</div>
          <div>
            <InputText
              v-model:value="receiptItem.batchCode"
              class="w-full"
              :disabled="!!receiptItem.batchId" />
          </div>
        </div>

        <div
          v-if="settingStore.SCREEN_RECEIPT_UPSERT.receiptItemsSelect.batchCodeAndExpiryDate"
          style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>Hạn sử dụng</div>
          <div>
            <InputDate
              v-model:value="receiptItem.expiryDate"
              :disabled="!!receiptItem.batchId"
              typeParser="number"
              class="w-full" />
          </div>
        </div>

        <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div class="flex gap-2 justify-between">
            <div class="flex gap-1">
              <span>Số lượng</span>
              <span v-if="receiptItem.unitRate !== 1">
                (
                <b>{{ receiptItem.quantity }}</b>
                {{ receiptItem?.product?.unitBasicName }} )
              </span>
            </div>
          </div>
          <div class="flex">
            <div style="width: 120px">
              <VueSelect
                v-model:value="receiptItem.unitRate"
                :disabled="(receiptItem.product?.unitObject.length || 0) <= 1"
                :options="
                  receiptItem.product?.unitObject.map((i) => ({
                    value: i.rate,
                    text: i.name,
                    data: i,
                  })) || []
                "
                required />
            </div>
            <div class="flex-1">
              <InputNumber v-model:value="receiptItem.unitQuantity" :validate="{ gt: 0 }" />
            </div>
          </div>
        </div>

        <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>
            Giá nhập
            <span v-if="receiptItem.unitRate !== 1">
              (
              <b>{{ formatMoney(receiptItem.costPrice) }} /</b>
              {{ receiptItem?.product?.unitBasicName }})
            </span>
          </div>

          <div style="width: 100%">
            <InputMoney v-model:value="receiptItem.unitCostPrice" />
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 80%" class="mt-6 flex gap-4">
          <VueButton color="red" icon="trash" @click="clickDestroy">Xóa</VueButton>
          <VueButton style="margin-left: auto" type="reset" icon="close" @click="closeModal">
            Đóng lại
          </VueButton>
          <VueButton color="blue" type="submit" icon="save">Cập nhật</VueButton>
        </div>
      </form>
    </div>
  </VueModal>
</template>
<style lang="scss" scope></style>
