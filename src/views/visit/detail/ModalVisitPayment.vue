<script setup lang="ts">
import { CloseOutlined, SaveOutlined } from '@ant-design/icons-vue'
import { nextTick, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VueModal from '../../../common/VueModal.vue'
import { InputMoney, InputNumber } from '../../../common/vue-form'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { CustomerPaymentApi } from '../../../modules/customer-payment/customer-payment.api'
import { PaymentViewType, VoucherType } from '../../../modules/enum'
import { VisitStatus } from '../../../modules/visit'
import { VisitApi } from '../../../modules/visit/visit.api'
import { timeToText } from '../../../utils'
import CustomerPaymentTypeTag from '../../customer/CustomerPaymentTypeTag.vue'
import { visit } from './visit.ref'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'

const inputMoneyPayment = ref<InstanceType<typeof InputNumber>>()

const emit = defineEmits<{ (e: 'success'): void }>()

const screenStore = useScreenStore()
const { formatMoney } = screenStore

const showModal = ref(false)
const paymentLoading = ref(false)
const paymentView = ref(PaymentViewType.Success)

const money = ref(0)

const openModal = async (view: PaymentViewType) => {
  paymentView.value = view
  money.value = 0
  showModal.value = true
  visit.value.customerPayments = await CustomerPaymentApi.list({
    filter: {
      customerId: visit.value.customerId,
      voucherId: visit.value.id,
      voucherType: VoucherType.Visit,
    },
    sort: { id: 'ASC' },
  })
  nextTick(() => inputMoneyPayment.value?.focus())
}

const closeModal = () => {
  showModal.value = false
}

const startPrepayment = async () => {
  paymentLoading.value = true
  try {
    await VisitApi.prepayment(visit.value.id, money.value)
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalVisitPayment.vue:54 ~ startPrepayment ~ error:', error)
  } finally {
    paymentLoading.value = false
  }
}

const startRefundOverpaid = async () => {
  if (visit.value.paid - money.value < visit.value.totalMoney) {
    return AlertStore.addError('Số tiền hoàn trả quá lớn')
  }
  paymentLoading.value = true
  try {
    await VisitApi.refundOverpaid(visit.value.id, money.value)
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalVisitPayment.vue:67 ~ startRefundOverpaid ~ error:', error)
  } finally {
    paymentLoading.value = false
  }
}

const startPayDebt = async () => {
  paymentLoading.value = true
  try {
    await VisitApi.payDebt(visit.value.id, money.value)
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalVisitPayment.vue:80 ~ startPayDebt ~ error:', error)
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
        <div class="flex-1 text-lg font-medium">
          Thông tin thanh toán: {{ visit.customer?.fullName }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <CloseOutlined />
        </div>
      </div>

      <div class="p-4">
        <div class="text-right">
          <span class="mr-2">Tổng chi phí: </span>
          <span class="font-bold" style="font-size: 16px">
            {{ formatMoney(visit.totalMoney) }}</span
          >
        </div>
        <div class="table-wrapper mt-2">
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
              <tr v-for="(customerPayment, index) in visit.customerPayments" :key="index">
                <td class="text-center">{{ index + 1 }}</td>
                <td class="text-center">
                  {{ timeToText(customerPayment.createdAt, 'hh:mm DD/MM/YY') }}
                </td>
                <td><CustomerPaymentTypeTag :paymentType="customerPayment.paymentType" /></td>
                <td class="text-right">
                  <div>{{ formatMoney(customerPayment.paid) }}</div>
                  <div v-if="customerPayment.debit" style="font-size: 12px; font-style: italic">
                    Ghi nợ: {{ formatMoney(customerPayment.debit) }}
                  </div>
                </td>
              </tr>
              <tr>
                <td colspan="3" class="text-right">Tổng đã thanh toán :</td>
                <td class="text-right font-bold">{{ formatMoney(visit.paid) }}</td>
              </tr>
              <tr v-if="visit.visitStatus !== VisitStatus.Completed">
                <td colspan="3" class="text-right">
                  <span v-if="visit.debt > 0"> Đang thiếu: </span>
                  <span v-else> Đang thừa : </span>
                </td>
                <td class="text-right font-bold">{{ formatMoney(Math.abs(visit.debt)) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <form v-if="paymentView === PaymentViewType.Prepayment" @submit.prevent="startPrepayment">
          <table class="w-full mt-4">
            <tbody>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap; width: 30%">
                  Tạm ứng lần này :
                </td>
                <td>
                  <div class="flex items-stretch pl-6">
                    <VueButton type="button" @click="money = visit.debt > 0 ? visit.debt : 0">
                      Tất cả
                    </VueButton>
                    <div class="flex-1">
                      <InputMoney
                        ref="inputMoneyPayment"
                        v-model:value="money"
                        :validate="{ gt: 0 }"
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
              <tr v-if="visit.paid + money <= visit.totalMoney">
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">Còn thiếu :</td>
                <td class="w-full font-bold text-right pr-3" style="font-size: 16px">
                  {{ formatMoney(visit.totalMoney - (visit.paid + money)) }}
                </td>
              </tr>
              <tr v-else style="color: var(--text-red)">
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">Thừa :</td>
                <td class="w-full font-bold text-right pr-3" style="font-size: 16px">
                  {{ formatMoney(visit.paid + money - visit.totalMoney) }}
                </td>
              </tr>
            </tbody>
          </table>
          <div class="pb-4 pt-8 flex justify-center gap-4">
            <VueButton color="blue" type="submit" :loading="paymentLoading">
              <SaveOutlined /> Tạm ứng
            </VueButton>
          </div>
        </form>
        <form v-else-if="paymentView === PaymentViewType.PayDebt" @submit.prevent="startPayDebt">
          <table class="w-full mt-4">
            <tbody>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap; width: 30%">
                  Trả nợ :
                </td>
                <td>
                  <div class="flex items-stretch pl-6">
                    <VueButton type="button" @click="money = visit.debt"> Tất cả </VueButton>
                    <div class="flex-1">
                      <InputNumber
                        ref="inputMoneyPayment"
                        v-model:value="money"
                        :validate="{ gt: 0 }"
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
              <tr v-if="visit.paid + money <= visit.totalMoney">
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">Nợ còn :</td>
                <td class="w-full font-bold text-right pr-3" style="font-size: 16px">
                  {{ formatMoney(visit.totalMoney - (visit.paid + money)) }}
                </td>
              </tr>
              <tr v-else style="color: var(--text-red)">
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">Thừa :</td>
                <td class="w-full font-bold text-right pr-3" style="font-size: 16px">
                  {{ formatMoney(visit.paid + money - visit.totalMoney) }}
                </td>
              </tr>
            </tbody>
          </table>
          <div class="pb-4 pt-8 flex justify-center gap-4">
            <VueButton type="submit" color="blue" :loading="paymentLoading">
              <SaveOutlined /> Trả nợ
            </VueButton>
          </div>
        </form>
        <form
          v-else-if="paymentView === PaymentViewType.RefundOverpaid"
          @submit.prevent="startRefundOverpaid"
        >
          <table class="w-full mt-4">
            <tbody>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap; width: 30%">
                  Hoàn trả:
                </td>
                <td>
                  <div class="flex items-stretch pl-6">
                    <VueButton type="button" @click="money = -visit.debt"> Tất cả </VueButton>
                    <div class="flex-1">
                      <InputNumber
                        ref="inputMoneyPayment"
                        v-model:value="money"
                        :validate="{ gt: 0 }"
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
              <tr v-if="visit.paid - money >= visit.totalMoney">
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">Còn thừa</td>
                <td class="w-full font-bold text-right pr-3" style="font-size: 16px">
                  {{ formatMoney(visit.paid - money - visit.totalMoney) }}
                </td>
              </tr>
              <tr v-else style="color: var(--text-red)">
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">Thiếu</td>
                <td class="w-full font-bold text-right pr-3" style="font-size: 16px">
                  {{ formatMoney(visit.totalMoney - (visit.paid - money)) }}
                </td>
              </tr>
            </tbody>
          </table>
          <div class="pb-4 pt-8 flex justify-center gap-4">
            <VueButton type="submit" color="blue" :loading="paymentLoading">
              <SaveOutlined /> Hoàn trả
            </VueButton>
          </div>
        </form>

        <div v-else class="pb-4 pt-8 flex justify-center gap-4">
          <VueButton type="reset" class="btn" @click="closeModal">
            <CloseOutlined /> Đóng lại
          </VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>
