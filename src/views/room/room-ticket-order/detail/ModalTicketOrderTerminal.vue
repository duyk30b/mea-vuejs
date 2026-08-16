<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose, IconQuestionCircle } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DeliveryStatus } from '@/modules/enum'
import { TicketActionApi } from '@/modules/ticket'
import { ticketRef } from '@/store/room.store'
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
    const terminalResult = await TicketActionApi.terminate({
      ticketId: ticketRef.value.id,
      body: {
        note: '',
        walletId: walletId.value,
      },
    })

    AlertStore.add({ type: 'success', message: 'Hủy phiếu thành công', time: 1000 })
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ ModalTicketOrderTerminal.vue:43 ~ startTerminal ~ error:', error)
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
            Bạn có chắc chắn muốn "HỦY" hóa đơn này
          </span>
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <div class="p-4">
        <p v-if="ticketRef.deliveryStatus === DeliveryStatus.Delivered">
          - Kho hàng sẽ nhập lại tất cả hàng hóa trong đơn
        </p>
        <p v-if="ticketRef.debtTotal">
          - Trừ nợ khách hàng: {{ formatMoney(ticketRef.debtTotal) }}
        </p>
        <p v-if="ticketRef.paidTotal">
          - Khách hàng nhận lại số tiền đã thanh toán là:
          {{ formatMoney(ticketRef.paidTotal) }}
        </p>
        <div class="flex items-center gap-2 mb-4" v-if="ticketRef.paidTotal">
          <div>- Phương thức thanh toán</div>
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
