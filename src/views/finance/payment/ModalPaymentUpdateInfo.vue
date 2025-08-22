<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputMoney, InputText } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { PaymentApi } from '@/modules/payment/payment.api'
import { MoneyDirection, Payment } from '@/modules/payment/payment.model'
import InputSelectPaymentMethod from '@/views/component/InputSelectPaymentMethod.vue'
import { onMounted, ref } from 'vue'

const inputMoneyPay = ref<InstanceType<typeof InputMoney>>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const payment = ref<Payment>(Payment.blank())

const paymentMethodOptions = ref<{ value: any; label: string }[]>([])

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
        paymentMethodId: payment.value.paymentMethodId,
        note: payment.value.note,
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

const handleClickDestroy = async (prescriptionId: number) => {
  ModalStore.confirm({
    title: 'Bạn có chắc muốn xóa phiếu thanh toán này ?',
    content: 'Phiếu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    onOk: async () => {
      try {
        if (payment.value.moneyDirection === MoneyDirection.In) {
          await PaymentApi.otherDestroyMoneyIn({
            paymentId: payment.value.id,
          })
          emit('success')
        }
        if (payment.value.moneyDirection === MoneyDirection.Out) {
          await PaymentApi.otherDestroyMoneyOut({
            paymentId: payment.value.id,
          })
          emit('success')
        }
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
      <div class="flex-1 font-medium" style="font-size: 16px">
        <span v-if="payment.moneyDirection === MoneyDirection.In">
          Cập nhật thông tin phiếu thu
        </span>
        <span v-if="payment.moneyDirection === MoneyDirection.Out">
          Cập nhật thông tin phiếu chi
        </span>
        <span v-if="payment.moneyDirection === MoneyDirection.Other">
          Cập nhật thông tin phiếu thanh toán
        </span>
      </div>
      <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
        <IconClose />
      </div>
    </div>
    <form class="bg-white p-4" @submit.prevent="handleUpdateInfo">
      <div class="flex flex-wrap gap-4">
        <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
          <div>
            <div>Phương thức thanh toán</div>
            <div>
              <InputSelectPaymentMethod v-model:paymentMethodId="payment.paymentMethodId" />
            </div>
          </div>
          <div class="mt-4">
            <div>Ghi chú</div>
            <div>
              <InputText v-model:value="payment.note" />
            </div>
          </div>
        </div>
      </div>

      <div class="mt-8 flex gap-4">
        <VueButton type="reset" icon="close" @click="closeModal">Hủy bỏ</VueButton>
        <VueButton
          v-if="payment.voucherId === 0"
          type="button"
          icon="trash"
          color="red"
          @click="handleClickDestroy"
        >
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
