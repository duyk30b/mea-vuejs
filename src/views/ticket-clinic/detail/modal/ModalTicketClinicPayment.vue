<script setup lang="ts">
import { CloseOutlined, SaveOutlined } from '@ant-design/icons-vue'
import { nextTick, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputMoney, InputNumber } from '../../../../common/vue-form'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { CustomerPaymentApi } from '../../../../modules/customer-payment/customer-payment.api'
import { PaymentViewType } from '../../../../modules/enum'
import { TicketStatus } from '../../../../modules/ticket'
import { TicketClinicApi } from '../../../../modules/ticket-clinic'
import { timeToText } from '../../../../utils'
import CustomerPaymentTypeTag from '../../../customer/CustomerPaymentTypeTag.vue'
import { ticketClinic } from '../ticket-clinic-detail.ref'

const inputMoneyPayment = ref<InstanceType<typeof InputNumber>>()

const emit = defineEmits<{ (e: 'success'): void }>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const showModal = ref(false)
const paymentLoading = ref(false)
const paymentView = ref(PaymentViewType.Success)

const money = ref(0)

const openModal = async (view: PaymentViewType) => {
  paymentView.value = view
  money.value = 0
  showModal.value = true
  ticketClinic.value.customerPaymentList = await CustomerPaymentApi.list({
    filter: {
      customerId: ticketClinic.value.customerId,
      ticketId: ticketClinic.value.id,
    },
    sort: { id: 'ASC' },
  })
  if (!isMobile) {
    nextTick(() => inputMoneyPayment.value?.focus())
  }
}

const closeModal = () => {
  showModal.value = false
}

const startPrepayment = async () => {
  paymentLoading.value = true
  try {
    await TicketClinicApi.prepayment(ticketClinic.value.id, money.value)
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalVisitPayment.vue:54 ~ startPrepayment ~ error:', error)
  } finally {
    paymentLoading.value = false
  }
}

const startRefundOverpaid = async () => {
  if (ticketClinic.value.paid - money.value < ticketClinic.value.totalMoney) {
    return AlertStore.addError('Số tiền hoàn trả không hợp lệ')
  }
  paymentLoading.value = true
  try {
    await TicketClinicApi.refundOverpaid(ticketClinic.value.id, money.value)
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
    await TicketClinicApi.payDebt(ticketClinic.value.id, money.value)
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
          Thông tin thanh toán: {{ ticketClinic.customer?.fullName }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <CloseOutlined />
        </div>
      </div>

      <div class="p-4">
        <div class="text-right">
          <span class="mr-2">Tổng chi phí:</span>
          <span class="font-bold" style="font-size: 16px">
            {{ formatMoney(ticketClinic.totalMoney) }}
          </span>
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
              <tr v-for="(customerPayment, index) in ticketClinic.customerPaymentList" :key="index">
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
                <td class="text-right font-bold">{{ formatMoney(ticketClinic.paid) }}</td>
              </tr>
              <tr v-if="ticketClinic.ticketStatus !== TicketStatus.Completed">
                <td colspan="3" class="text-right">
                  <span v-if="ticketClinic.debt >= 0">Đang thiếu:</span>
                  <span v-else>Đang thừa :</span>
                </td>
                <td class="text-right font-bold">{{ formatMoney(Math.abs(ticketClinic.debt)) }}</td>
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
                    <VueButton
                      type="button"
                      @click="money = ticketClinic.debt > 0 ? ticketClinic.debt : 0">
                      Tất cả
                    </VueButton>
                    <div class="flex-1">
                      <InputMoney
                        ref="inputMoneyPayment"
                        v-model:value="money"
                        :validate="{ gt: 0 }"
                        text-align="right" />
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td class="py-1"></td>
                <td></td>
              </tr>
              <tr v-if="ticketClinic.debt - money >= 0">
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">Còn thiếu :</td>
                <td class="w-full font-bold text-right pr-3" style="font-size: 16px">
                  {{ formatMoney(ticketClinic.debt - money) }}
                </td>
              </tr>
              <tr v-else style="color: var(--text-red)">
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">Thừa :</td>
                <td class="w-full font-bold text-right pr-3" style="font-size: 16px">
                  {{ formatMoney(money - ticketClinic.debt) }}
                </td>
              </tr>
            </tbody>
          </table>
          <div class="pb-4 pt-8 flex justify-center gap-4">
            <VueButton color="blue" type="submit" :loading="paymentLoading">
              <SaveOutlined />
              Tạm ứng
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
                    <VueButton type="button" @click="money = ticketClinic.debt">Tất cả</VueButton>
                    <div class="flex-1">
                      <InputMoney
                        ref="inputMoneyPayment"
                        v-model:value="money"
                        :validate="{ gt: 0, lte: ticketClinic.debt }"
                        text-align="right" />
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td class="py-1"></td>
                <td></td>
              </tr>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">Nợ còn :</td>
                <td class="w-full font-bold text-right pr-3" style="font-size: 16px">
                  {{ formatMoney(ticketClinic.debt - money) }}
                </td>
              </tr>
            </tbody>
          </table>
          <div class="pb-4 pt-8 flex justify-center gap-4">
            <VueButton type="submit" color="blue" :loading="paymentLoading">
              <SaveOutlined />
              Trả nợ
            </VueButton>
          </div>
        </form>
        <form
          v-else-if="paymentView === PaymentViewType.RefundOverpaid"
          @submit.prevent="startRefundOverpaid">
          <table class="w-full mt-4">
            <tbody>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap; width: 30%">
                  Hoàn trả:
                </td>
                <td>
                  <div class="flex items-stretch pl-6">
                    <VueButton type="button" @click="money = -ticketClinic.debt">Tất cả</VueButton>
                    <div class="flex-1">
                      <InputMoney
                        ref="inputMoneyPayment"
                        v-model:value="money"
                        :validate="{ gt: 0, lte: -ticketClinic.debt }"
                        text-align="right" />
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td class="py-1"></td>
                <td></td>
              </tr>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">Còn thừa</td>
                <td class="w-full font-bold text-right pr-3" style="font-size: 16px">
                  {{ formatMoney(-ticketClinic.debt - money) }}
                </td>
              </tr>
            </tbody>
          </table>
          <div class="pb-4 pt-8 flex justify-center gap-4">
            <VueButton type="submit" color="blue" :loading="paymentLoading">
              <SaveOutlined />
              Hoàn trả
            </VueButton>
          </div>
        </form>

        <div v-else class="pb-4 pt-8 flex justify-center gap-4">
          <VueButton type="reset" class="btn" @click="closeModal">
            <CloseOutlined />
            Đóng lại
          </VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>
