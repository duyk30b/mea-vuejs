<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose, IconQuestionCircle } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DeliveryStatus } from '@/modules/enum'
import { PurchaseOrderActionApi } from '@/modules/purchase-order'
import { purchaseOrderDetailRef } from '@/store/purchase-order.store'
import InputSelectWallet from '@/views/component/InputSelectWallet.vue'
import { ref } from 'vue'

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const showModal = ref(false)
const saveLoading = ref(false)
const walletId = ref<string>('')

const openModal = () => {
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const startTerminal = async () => {
  try {
    saveLoading.value = true
    const terminalResult = await PurchaseOrderActionApi.terminate({
      walletId: walletId.value,
      note: '',
      purchaseOrderId: purchaseOrderDetailRef.value.id,
    })

    Object.assign(purchaseOrderDetailRef.value, terminalResult.purchaseOrderModified)
    AlertStore.add({ type: 'success', message: 'Hủy phiếu thành công', time: 1000 })
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ ModalPurchaseOrderTerminal.vue:44 ~ startTerminal ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 600px; margin-top: 50px">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 flex items-center gap-2">
          <span style="line-height: 0; font-size: 18px; color: red">
            <IconQuestionCircle />
          </span>
          <span class="font-medium" style="font-size: 16px">
            Bạn có chắc chắn muốn "HỦY" phiếu nhập hàng này
          </span>
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <div class="p-4">
        <p v-if="purchaseOrderDetailRef.deliveryStatus === DeliveryStatus.Delivered">
          - Kho hàng sẽ phải xuất lại tất cả hàng hóa trong phiếu
        </p>
        <p v-if="purchaseOrderDetailRef.debt">
          - Trừ nợ nhà cung cấp: {{ formatMoney(purchaseOrderDetailRef.debt) }}
        </p>
        <p v-if="purchaseOrderDetailRef.paid">
          - Nhà cung cấp cần trả lại số tiền đã thanh toán là:
          {{ formatMoney(purchaseOrderDetailRef.paid) }}
        </p>
        <div class="flex items-center gap-2 mb-4" v-if="purchaseOrderDetailRef.paid">
          <div>- Phương thức nhận tiền</div>
          <div style="min-width: 150px">
            <InputSelectWallet v-model:walletId="walletId" autoSelectFirstValue />
          </div>
        </div>
        <p>- Đơn bị hủy sẽ không thể phục hồi lại được</p>
      </div>
      <div class="p-4">
        <div class="flex gap-4">
          <VueButton style="margin-left: auto" type="reset" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton color="blue" :loading="saveLoading" @click="startTerminal">Xác nhận</VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>
