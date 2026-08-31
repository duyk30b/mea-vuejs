<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputDate, InputMoney, InputText } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { PaymentApi } from '@/modules/payment/payment.api'
import { Payment } from '@/modules/payment/payment.model'
import InputSelectWallet from '@/views/component/InputSelectWallet.vue'
import { onMounted, ref } from 'vue'

const inputMoneyPay = ref<InstanceType<typeof InputMoney>>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const payment = ref<Payment>(Payment.blank())

const showModal = ref(false)
const saveLoading = ref(false)

onMounted(async () => {})

const openModal = async (paymentProp: Payment) => {
  showModal.value = true
  payment.value = Payment.from(paymentProp)
}

const closeModal = () => {
  showModal.value = false
  payment.value = Payment.blank()
}

const handleUpdateInfo = async () => {
  saveLoading.value = true
  try {
    await PaymentApi.updateInfo({
      paymentId: payment.value.id,
      body: {
        createdAt: payment.value.createdAt,
        note: payment.value.note,
        walletId: payment.value.walletId,
      },
    })
    emit('success')
    AlertStore.addSuccess(`Cập nhật thông tin thành công`)
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalPaymentUpdateInfo.vue:63 ~ handleUpdateInfo ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleClickDestroy = async () => {
  ModalStore.confirm({
    title: 'Bạn có chắc muốn xóa phiếu thanh toán này ?',
    content:
      'Xóa phiếu thanh toán có thể gây sai lệch về lịch sử tiền và ví thanh toán, bạn vẫn muốn xóa ?',
    onOk: async () => {
      try {
        await PaymentApi.destroy({ paymentId: payment.value.id })
        emit('success')
        AlertStore.addSuccess(`Xóa phiếu thành công`)
        closeModal()
      } catch (error) {
        console.log('🚀 ~ ModalPaymentUpdateInfo.vue:87 ~ handleClickDestroy ~ error:', error)
      } finally {
        saveLoading.value = false
      }
    },
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 50px" @close="closeModal">
    <div class="pl-4 py-3 flex items-center bg-white" style="border-bottom: 1px solid #dedede">
      <div class="flex-1 font-medium" style="font-size: 16px">Cập nhật thông tin thanh toán</div>
      <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
        <IconClose />
      </div>
    </div>
    <form class="bg-white p-4" @submit.prevent="handleUpdateInfo">
      <div class="flex flex-wrap gap-4">
        <div style="flex-grow: 1; flex-basis: 90%; min-width: 300px">
          <div>Thời gian thanh toán</div>
          <div>
            <InputDate v-model:value="payment.createdAt" showTime typeParser="number" />
          </div>
        </div>
        <div v-if="payment.paidTotal != 0" style="flex-grow: 1; flex-basis: 90%; min-width: 300px">
          <div>Phương thức thanh toán</div>
          <div>
            <InputSelectWallet v-model:walletId="payment.walletId" />
          </div>
        </div>
        <div style="flex-grow: 1; flex-basis: 90%; min-width: 300px">
          <div>Ghi chú</div>
          <div>
            <InputText v-model:value="payment.note" />
          </div>
        </div>
      </div>

      <div class="mt-8 flex gap-4">
        <VueButton type="reset" icon="close" @click="closeModal">Hủy bỏ</VueButton>
        <VueButton type="button" icon="trash" color="red" @click="handleClickDestroy">
          Xóa phiếu
        </VueButton>
        <VueButton
          type="submit"
          color="blue"
          :loading="saveLoading"
          icon="save"
          style="margin-left: auto"
        >
          Cập nhật
        </VueButton>
      </div>
    </form>
  </VueModal>
</template>
