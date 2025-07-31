<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputMoney, InputSelect, InputText, VueSelect } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { PaymentMethodService } from '@/modules/payment-method'
import { PaymentApi } from '@/modules/payment/payment.api'
import { MoneyDirection, Payment } from '@/modules/payment/payment.model'
import { onMounted, ref } from 'vue'

const inputMoneyPay = ref<InstanceType<typeof InputMoney>>()

const emit = defineEmits<{
  (e: 'success', value: { payment: Payment }): void
}>()

const money = ref(0)
const note = ref('')
const paymentMethodId = ref<number>(0)
const paymentMethodOptions = ref<{ value: any; label: string }[]>([])

const moneyDirection = ref(MoneyDirection.In)

const showModal = ref(false)
const saveLoading = ref(false)

onMounted(async () => {
  const paymentMethodAll = await PaymentMethodService.list({ sort: { priority: 'ASC' } })
  paymentMethodOptions.value = paymentMethodAll.map((i) => ({ value: i.id, label: i.name }))
  paymentMethodId.value = paymentMethodAll[0]?.id || 0
})

const openModal = async (moneyDirectionProp: MoneyDirection) => {
  showModal.value = true
  moneyDirection.value = moneyDirectionProp
}

const closeModal = () => {
  showModal.value = false
  money.value = 0
  note.value = ''
  paymentMethodId.value = 0
  paymentMethodOptions.value = []
}

const handleSave = async () => {
  saveLoading.value = true
  if (money.value === 0) {
    return AlertStore.addError('Số tiền trả nợ phải khác 0')
  }
  try {
    if (moneyDirection.value === MoneyDirection.In) {
      const payment = await PaymentApi.otherPaymentIn({
        paymentMethodId: paymentMethodId.value,
        note: note.value,
        paidAmount: money.value,
      })
      emit('success', { payment })
    }
    if (moneyDirection.value === MoneyDirection.Out) {
      const payment = await PaymentApi.otherPaymentOut({
        paymentMethodId: paymentMethodId.value,
        note: note.value,
        paidAmount: money.value,
      })
      emit('success', { payment })
    }
    AlertStore.addSuccess(`Thanh toán thành công`)
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalOtherPaymentMoney.vue:77 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 50px" @close="closeModal">
    <div class="pl-4 py-3 flex items-center bg-white" style="border-bottom: 1px solid #dedede">
      <div class="flex-1 font-medium" style="font-size: 16px">
        <span v-if="moneyDirection === MoneyDirection.In">Tạo phiếu thu</span>
        <span v-if="moneyDirection === MoneyDirection.Out">Tạo phiếu chi</span>
      </div>
      <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
        <IconClose />
      </div>
    </div>
    <form class="bg-white p-4" @submit.prevent="handleSave">
      <div class="flex flex-wrap gap-4">
        <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
          <div>
            <div>Phương thức thanh toán</div>
            <div>
              <InputSelect v-model:value="paymentMethodId" :options="paymentMethodOptions" />
            </div>
          </div>
          <div class="mt-4">
            <div>Lý do</div>
            <div>
              <InputText v-model:value="note" />
            </div>
          </div>
        </div>
        <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
          <div style="flex: 1; flex-basis: 250px">
            <div>Loại phiếu</div>
            <div>
              <VueSelect
                v-model:value="moneyDirection"
                disabled
                :options="[
                  { value: MoneyDirection.In, text: 'Phiếu thu' },
                  { value: MoneyDirection.Out, text: 'Phiếu chi' },
                ]"
              />
            </div>
          </div>

          <div class="mt-4">
            <div class="flex flex-wrap justify-between">
              <span>Số tiền thanh toán</span>
            </div>
            <div>
              <InputMoney
                ref="inputMoneyPay"
                v-model:value="money"
                textAlign="right"
                :validate="{ gt: 0 }"
                required
              />
            </div>
          </div>
        </div>
      </div>

      <div class="p-4">
        <div class="flex justify-center gap-4">
          <VueButton type="reset" icon="close" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton type="submit" color="blue" :loading="saveLoading" icon="save">
            Xác nhận thanh toán
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>
