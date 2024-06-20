<script setup lang="ts">
import { CloseOutlined, SaveOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { nextTick, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VueModal from '../../../common/VueModal.vue'
import { InputMoney } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { PaymentViewType } from '../../../modules/enum'
import { InvoiceApi, InvoiceStatus } from '../../../modules/invoice'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { timeToText } from '../../../utils'
import CustomerPaymentTypeTag from '../../../views/customer/CustomerPaymentTypeTag.vue'
import { invoice } from './invoice-detail.ref'

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
      const { invoiceBasic, customerPayments } = await InvoiceApi.prepayment(
        invoice.value.id,
        money.value
      )
      Object.assign(invoice.value, invoiceBasic)
      invoice.value.customerPayments = customerPayments
    }
    if (paymentView.value === PaymentViewType.SendProductAndPayment) {
      const { invoiceBasic, customerPayments } = await InvoiceApi.sendProductAndPayment(
        invoice.value.id,
        money.value
      )
      Object.assign(invoice.value, invoiceBasic)
      invoice.value.customerPayments = customerPayments
    }
    if (paymentView.value === PaymentViewType.PayDebt) {
      const { invoiceBasic, customerPayments } = await InvoiceApi.payDebt(
        invoice.value.id,
        money.value
      )
      Object.assign(invoice.value, invoiceBasic)
      invoice.value.customerPayments = customerPayments
    }

    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:64 ~ handlePayment ~ error:', error)
  } finally {
    paymentLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 600px">
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
          <span class="pr-4 font-bold" style="font-size: 16px">
            {{ formatMoney(invoice.totalMoney) }}</span
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
              <tr v-if="invoice.customerPayments?.length == 0">
                <td colspan="20" class="text-center">Chưa thanh toán</td>
              </tr>
              <tr v-for="(customerPayment, index) in invoice.customerPayments" :key="index">
                <td class="text-center">
                  {{ index + 1 }}
                </td>
                <td class="text-left">
                  <div>
                    {{ timeToText(customerPayment.createdAt, 'DD/MM/YY hh:mm') }}
                  </div>
                  <div v-if="customerPayment.note" style="font-size: 0.8rem">
                    {{ customerPayment.note }}
                  </div>
                  <div v-if="customerPayment.description" style="font-size: 0.8rem">
                    {{ customerPayment.description }}
                  </div>
                </td>
                <td>
                  <CustomerPaymentTypeTag :paymentType="customerPayment.paymentType" />
                </td>
                <td class="text-right" style="padding-right: 12px">
                  <div>{{ formatMoney(customerPayment.paid) }}</div>
                </td>
              </tr>
              <tr>
                <td colspan="3" class="text-right">Tổng đã thanh toán :</td>
                <td class="text-right font-bold">{{ formatMoney(invoice.paid) }}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-right">
                  <span v-if="paymentView == PaymentViewType.PayDebt"> Đang nợ : </span>
                  <span v-else> Đang thiếu : </span>
                </td>
                <td class="text-right font-bold">
                  {{ formatMoney(invoice.totalMoney - invoice.paid) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <form @submit.prevent="(e) => handlePayment()">
        <div
          v-if="
            [InvoiceStatus.Draft, InvoiceStatus.Prepayment, InvoiceStatus.Debt].includes(
              invoice.status
            )
          "
          class="px-4"
        >
          <table class="w-full">
            <tbody>
              <tr>
                <td class="py-1"></td>
                <td></td>
              </tr>
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
                      @click="money = invoice.totalMoney - invoice.paid"
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
                  {{ formatMoney(invoice.totalMoney - invoice.paid - money) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 pb-4 flex justify-center gap-4">
          <div
            v-if="
              permissionIdMap[PermissionId.INVOICE_PREPAYMENT] &&
              [InvoiceStatus.Draft, InvoiceStatus.Prepayment, InvoiceStatus.Debt].includes(
                invoice.status
              )
            "
          >
            <VueButton type="submit" color="blue" :loading="paymentLoading">
              <template #icon>
                <SaveOutlined />
              </template>
              <span v-if="paymentView == PaymentViewType.Prepayment"> Tạm ứng </span>
              <span v-if="paymentView == PaymentViewType.SendProductAndPayment">
                Gửi hàng và thanh toán
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
