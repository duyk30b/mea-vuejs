<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon-antd'
import { AlertStore } from '../../../common/vue-alert'
import { InputMoney, InputSelect } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { PaymentViewType } from '../../../modules/enum'
import { PaymentMethodService } from '../../../modules/payment-method'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { ReceiptApi, ReceiptStatus } from '../../../modules/receipt'
import { timeToText } from '../../../utils'
import PaymentTimingTag from '../../payment/PaymentTimingTag.vue'
import { receipt } from './receipt-detail.ref'

const inputMoneyPayment = ref<InstanceType<typeof InputMoney>>()

const emit = defineEmits<{ (e: 'success'): void }>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const showModal = ref(false)
const paymentLoading = ref(false)
const paymentView = ref(PaymentViewType.Success)

const money = ref(0)
const paymentMethodId = ref<number>(0)
const paymentMethodOptions = ref<{ value: any; label: string }[]>([])

onMounted(async () => {
  try {
    const paymentMethodAll = await PaymentMethodService.list({ sort: { priority: 'ASC' } })
    paymentMethodOptions.value = paymentMethodAll.map((i) => ({ value: i.id, label: i.name }))
    paymentMethodId.value = paymentMethodAll[0]?.id || 0
  } catch (error) {
    console.log('🚀 ~ ModalReceiptPayment.vue:43 ~ openModal ~ error:', error)
  }
})

const openModal = async (view = PaymentViewType.Success) => {
  paymentView.value = view
  money.value = 0
  showModal.value = true

  if (!isMobile) {
    nextTick(() => inputMoneyPayment.value?.focus())
  }
}

const closeModal = () => {
  showModal.value = false
  paymentView.value = PaymentViewType.Success
  money.value = 0
}

const handlePayment = async () => {
  paymentLoading.value = true
  try {
    if (paymentView.value === PaymentViewType.SendProductAndPaymentAndClose) {
      if (money.value < 0 || money.value + receipt.value.paid > receipt.value.totalMoney) {
        inputMoneyPayment.value?.focus()
        return AlertStore.addError('Số tiền thanh toán không hợp lệ')
      }
      const result = await ReceiptApi.sendProductAndPaymentAndClose({
        receiptId: receipt.value.id,
        money: money.value,
        paymentMethodId: paymentMethodId.value,
      })
      Object.assign(receipt.value, result.receipt)
      if (result.payment) {
        receipt.value.paymentList?.push(result.payment)
      }
    }
    if (paymentView.value === PaymentViewType.Prepayment) {
      if (receipt.value.status === ReceiptStatus.Draft && money.value < 0) {
        return AlertStore.addError('Số tiền không hợp lệ')
      }
      if (receipt.value.status !== ReceiptStatus.Draft && money.value <= 0) {
        return AlertStore.addError('Số tiền không hợp lệ')
      }
      const result = await ReceiptApi.prepayment({
        receiptId: receipt.value.id,
        money: money.value,
        paymentMethodId: paymentMethodId.value,
      })
      Object.assign(receipt.value, result.receipt)
      if (result.payment) {
        receipt.value.paymentList?.push(result.payment)
      }
    }
    if (paymentView.value === PaymentViewType.PayDebt) {
      if (money.value <= 0 || money.value + receipt.value.paid > receipt.value.totalMoney) {
        inputMoneyPayment.value?.focus()
        return AlertStore.addError('Số tiền thanh toán không hợp lệ')
      }
      const result = await ReceiptApi.payDebt({
        receiptId: receipt.value.id,
        money: money.value,
        paymentMethodId: paymentMethodId.value,
      })
      Object.assign(receipt.value, result.receipt)
      if (result.payment) {
        receipt.value.paymentList?.push(result.payment)
      }
    }
    if (paymentView.value === PaymentViewType.RefundOverpaid) {
      if (money.value <= 0 || receipt.value.paid - money.value < receipt.value.totalMoney) {
        inputMoneyPayment.value?.focus()
        return AlertStore.addError('Số tiền thanh toán không hợp lệ')
      }
      const result = await ReceiptApi.refundOverpaid({
        receiptId: receipt.value.id,
        money: money.value,
        paymentMethodId: paymentMethodId.value,
      })
      Object.assign(receipt.value, result.receipt)
      if (result.payment) {
        receipt.value.paymentList?.push(result.payment)
      }
    }

    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalDistributorUpsert.vue:75 ~ handlePayment ~ error:', error)
  } finally {
    paymentLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" :style="'width: 600px'">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Thông tin thanh toán</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <div class="text-right">
          <span class="mr-2">Tổng tiền đơn:</span>
          <span class="font-bold" style="font-size: 16px">
            {{ formatMoney(receipt.totalMoney) }}
          </span>
        </div>
        <div class="mt-2 table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Thời gian</th>
                <th>Loại</th>
                <th>Tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(payment, index) in receipt.paymentList" :key="index">
                <td class="text-center">
                  {{ index + 1 }}
                </td>
                <td class="text-left">
                  <div>
                    {{ timeToText(payment.createdAt, 'DD/MM/YY hh:mm') }}
                  </div>
                  <div></div>
                  <div v-if="payment.note" style="font-size: 0.8rem">
                    {{ payment.note }}
                  </div>
                  <div v-if="payment.description" style="font-size: 0.8rem">
                    {{ payment.description }}
                  </div>
                </td>
                <td>
                  <PaymentTimingTag :paymentTiming="payment.paymentTiming" />
                </td>
                <td class="text-right" style="padding-right: 8px">
                  <div>{{ formatMoney(-payment.paidAmount) }}</div>
                </td>
              </tr>
              <tr>
                <td colspan="3" class="text-right">Tổng đã thanh toán :</td>
                <td class="text-right font-bold">{{ formatMoney(receipt.paid) }}</td>
              </tr>
              <tr v-if="receipt.debt >= 0">
                <td colspan="3" class="text-right">Đang thiếu :</td>
                <td class="text-right font-bold">{{ formatMoney(receipt.debt) }}</td>
              </tr>
              <tr v-else style="color: var(--text-green)">
                <td colspan="3" class="text-right">Đang thừa</td>
                <td class="text-right font-bold">{{ formatMoney(-receipt.debt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <form
        v-if="paymentView === PaymentViewType.RefundOverpaid"
        @submit.prevent="(e) => handlePayment()"
      >
        <div class="px-4">
          <table class="w-full mt-2">
            <tbody>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">PT Thanh toán :</td>
                <td>
                  <div class="pl-6">
                    <InputSelect v-model:value="paymentMethodId" :options="paymentMethodOptions" />
                  </div>
                </td>
              </tr>
              <tr>
                <td class="py-2"></td>
                <td></td>
              </tr>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap; width: 30%">
                  Số tiền hoàn trả :
                </td>
                <td>
                  <div class="flex items-stretch pl-6">
                    <VueButton
                      color="default"
                      type="button"
                      @click="money = receipt.paid - receipt.totalMoney"
                    >
                      Tất cả
                    </VueButton>
                    <div class="flex-1">
                      <InputMoney
                        ref="inputMoneyPayment"
                        v-model:value="money"
                        text-align="right"
                        :validate="{ gt: 0, lte: receipt.paid - receipt.totalMoney }"
                      />
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td class="py-1"></td>
                <td></td>
              </tr>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">Còn thừa :</td>
                <td class="w-full font-bold text-right pr-3" style="font-size: 16px">
                  {{ formatMoney(receipt.paid - money - receipt.totalMoney) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 pb-6 flex justify-center gap-4">
          <VueButton
            v-if="permissionIdMap[PermissionId.RECEIPT_REFUND_OVERPAID]"
            type="submit"
            color="blue"
            icon="save"
            :loading="paymentLoading"
          >
            Hoàn trả
          </VueButton>
        </div>
      </form>

      <form
        v-else-if="paymentView !== PaymentViewType.Success"
        @submit.prevent="(e) => handlePayment()"
      >
        <div class="px-4">
          <table class="w-full mt-2">
            <tbody>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">PT Thanh toán :</td>
                <td>
                  <div class="pl-6">
                    <InputSelect v-model:value="paymentMethodId" :options="paymentMethodOptions" />
                  </div>
                </td>
              </tr>
              <tr>
                <td class="py-2"></td>
                <td></td>
              </tr>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap; width: 30%">
                  <span v-if="paymentView == PaymentViewType.Prepayment">Tạm ứng lần này :</span>
                  <span v-if="paymentView == PaymentViewType.SendProductAndPaymentAndClose">
                    Thanh toán lần này :
                  </span>
                  <span v-if="paymentView == PaymentViewType.PayDebt">Trả nợ :</span>
                </td>
                <td>
                  <div class="flex items-stretch pl-6">
                    <VueButton
                      color="default"
                      type="button"
                      @click="money = receipt.totalMoney - receipt.paid"
                    >
                      Tất cả
                    </VueButton>
                    <div class="flex-1">
                      <InputMoney
                        ref="inputMoneyPayment"
                        v-model:value="money"
                        text-align="right"
                      />
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td class="py-1"></td>
                <td></td>
              </tr>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">
                  <span v-if="paymentView == PaymentViewType.PayDebt">Nợ còn :</span>
                  <span v-else>Còn thiếu :</span>
                </td>
                <td class="w-full font-bold text-right pr-3" style="font-size: 16px">
                  {{ formatMoney(receipt.totalMoney - (receipt.paid + money)) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 pb-6 flex justify-center gap-4">
          <VueButton
            v-if="permissionIdMap[PermissionId.RECEIPT_PAYMENT]"
            type="submit"
            color="blue"
            icon="save"
            :loading="paymentLoading"
          >
            <span v-if="paymentView == PaymentViewType.Prepayment">Tạm ứng</span>
            <template v-if="paymentView == PaymentViewType.SendProductAndPaymentAndClose">
              <span v-if="receipt.totalMoney <= money">Nhập hàng và Thanh toán</span>
              <span v-else>Nhập hàng và ghi nợ</span>
            </template>
            <template v-if="paymentView == PaymentViewType.PayDebt">
              <span v-if="money < receipt.debt">Trả nợ</span>
              <span v-else>Trả nợ và Kết thúc</span>
            </template>
          </VueButton>
        </div>
      </form>
      <div v-else class="pb-6 flex justify-center">
        <VueButton type="button" icon="close" @click="closeModal">Đóng lại</VueButton>
      </div>
    </div>
  </VueModal>
</template>
