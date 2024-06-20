<script setup lang="ts">
import { CloseOutlined, SaveOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VueModal from '../../../common/VueModal.vue'
import { InputMoney } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Receipt, ReceiptApi, ReceiptStatus } from '../../../modules/receipt'
import { timeToText } from '../../../utils'
import DistributorPaymentTypeTag from '../../../views/distributor/DistributorPaymentTypeTag.vue'
import { PaymentViewType } from '../../../modules/enum'
import { nextTick } from 'vue'
import { receipt } from './receipt-detail.ref'

const inputMoneyPayment = ref<InstanceType<typeof InputMoney>>()

const emit = defineEmits<{ (e: 'success'): void }>()

const screenStore = useScreenStore()
const { formatMoney, isMobile } = screenStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const showModal = ref(false)
const paymentLoading = ref(false)
const paymentView = ref(PaymentViewType.Success)

const money = ref(0)

const openModal = (view = PaymentViewType.Success) => {
  paymentView.value = view
  money.value = 0
  showModal.value = true
  if (!isMobile) {
    nextTick(() => inputMoneyPayment.value?.focus())
  }
}

const closeModal = () => {
  showModal.value = false
}

const handlePayment = async () => {
  paymentLoading.value = true
  try {
    if (paymentView.value === PaymentViewType.Prepayment) {
      const { receiptBasic, distributorPayments } = await ReceiptApi.prepayment(
        receipt.value.id,
        money.value
      )
      Object.assign(receipt.value, receiptBasic)
      receipt.value.distributorPayments = distributorPayments
    }
    if (paymentView.value === PaymentViewType.SendProductAndPayment) {
      const { receiptBasic, distributorPayments } = await ReceiptApi.sendProductAndPayment(
        receipt.value.id,
        money.value
      )
      Object.assign(receipt.value, receiptBasic)
      receipt.value.distributorPayments = distributorPayments
    }
    if (paymentView.value === PaymentViewType.PayDebt) {
      const { receiptBasic, distributorPayments } = await ReceiptApi.payDebt(
        receipt.value.id,
        money.value
      )
      Object.assign(receipt.value, receiptBasic)
      receipt.value.distributorPayments = distributorPayments
    }

    emit('success')
    showModal.value = false
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
          <CloseOutlined />
        </div>
      </div>

      <div class="p-4">
        <div class="text-right">
          <span class="mr-2">Tổng tiền đơn: </span>
          <span class="font-bold" style="font-size: 16px">
            {{ formatMoney(receipt.totalMoney) }}</span
          >
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
              <tr v-if="receipt.distributorPayments!.length == 0">
                <td colspan="20" class="text-center">Chưa thanh toán</td>
              </tr>
              <tr v-for="(distributorPayment, index) in receipt.distributorPayments" :key="index">
                <td class="text-center">
                  {{ index + 1 }}
                </td>
                <td class="text-left">
                  <div>
                    {{ timeToText(distributorPayment.createdAt, 'DD/MM/YY hh:mm') }}
                  </div>
                  <div></div>
                  <div v-if="distributorPayment.note" style="font-size: 0.8rem">
                    {{ distributorPayment.note }}
                  </div>
                  <div v-if="distributorPayment.description" style="font-size: 0.8rem">
                    {{ distributorPayment.description }}
                  </div>
                </td>
                <td>
                  <DistributorPaymentTypeTag :paymentType="distributorPayment.paymentType" />
                </td>
                <td class="text-right" style="padding-right: 12px">
                  <div>{{ formatMoney(distributorPayment.paid) }}</div>
                </td>
              </tr>
              <tr>
                <td colspan="3" class="text-right">Tổng đã thanh toán :</td>
                <td class="text-right font-bold">{{ formatMoney(receipt.paid) }}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-right">
                  <span v-if="paymentView == PaymentViewType.PayDebt"> Đang nợ : </span>
                  <span v-else> Đang thiếu : </span>
                </td>
                <td class="text-right font-bold">
                  {{ formatMoney(receipt.totalMoney - receipt.paid) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <form @submit.prevent="(e) => handlePayment()">
        <div
          v-if="
            [ReceiptStatus.Draft, ReceiptStatus.Prepayment, ReceiptStatus.Debt].includes(
              receipt.status
            )
          "
          class="px-4"
        >
          <table class="w-full mt-2">
            <tbody>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap; width: 30%">
                  <span v-if="paymentView == PaymentViewType.Prepayment"> Tạm ứng lần này : </span>
                  <span v-if="paymentView == PaymentViewType.SendProductAndPayment">
                    Thanh toán lần này :
                  </span>
                  <span v-if="paymentView == PaymentViewType.PayDebt"> Trả nợ : </span>
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
                        :validate="
                          paymentView === PaymentViewType.SendProductAndPayment ? {} : { gt: 0 }
                        "
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
                  <span v-if="paymentView == PaymentViewType.PayDebt"> Nợ còn : </span>
                  <span v-else> Còn thiếu : </span>
                </td>
                <td class="w-full font-bold text-right pr-3" style="font-size: 16px">
                  {{ formatMoney(receipt.totalMoney - receipt.paid - money) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 pb-6 flex justify-center gap-4">
          <div
            v-if="
              permissionIdMap[PermissionId.INVOICE_PREPAYMENT] &&
              [ReceiptStatus.Draft, ReceiptStatus.Prepayment, ReceiptStatus.Debt].includes(
                receipt.status
              )
            "
          >
            <VueButton type="submit" color="blue" :loading="paymentLoading">
              <template #icon>
                <SaveOutlined />
              </template>
              <span v-if="paymentView == PaymentViewType.Prepayment"> Tạm ứng </span>
              <span v-if="paymentView == PaymentViewType.SendProductAndPayment">
                Nhập hàng và thanh toán
              </span>
              <span v-if="paymentView == PaymentViewType.PayDebt"> Trả nợ </span>
            </VueButton>
          </div>
          <div v-else>
            <VueButton type="button" @click="closeModal"> <CloseOutlined /> Đóng lại </VueButton>
          </div>
        </div>
      </form>
    </div>
  </VueModal>
</template>
