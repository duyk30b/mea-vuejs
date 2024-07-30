<script setup lang="ts">
import { CloseOutlined, SaveOutlined } from '@ant-design/icons-vue'
import { nextTick, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputMoney, InputNumber } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { CustomerPaymentApi } from '../../../../modules/customer-payment/customer-payment.api'
import { PaymentViewType } from '../../../../modules/enum'
import { Ticket, TicketStatus } from '../../../../modules/ticket'
import { TicketClinicApi, ticketClinicRef } from '../../../../modules/ticket-clinic'
import { timeToText } from '../../../../utils'
import CustomerPaymentTypeTag from '../../../customer/CustomerPaymentTypeTag.vue'
import { ticket } from '../../../ticket-order/upsert/ticket-order-upsert.ref'

const inputMoneyPayment = ref<InstanceType<typeof InputNumber>>()

const emit = defineEmits<{ (e: 'success'): void }>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const showModal = ref(false)
const paymentLoading = ref(false)
const paymentView = ref(PaymentViewType.Success)
const ticketClone = ref(Ticket.blank())

const money = ref(0)

const openModal = async (view: PaymentViewType) => {
  paymentView.value = view
  money.value = 0
  showModal.value = true

  ticketClone.value = Ticket.from(ticketClinicRef.value)
  ticketClone.value.customerPaymentList = await CustomerPaymentApi.list({
    filter: {
      customerId: ticketClone.value.customerId,
      ticketId: ticketClone.value.id,
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
    await TicketClinicApi.prepayment(ticketClone.value.id, money.value)
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalVisitPayment.vue:54 ~ startPrepayment ~ error:', error)
  } finally {
    paymentLoading.value = false
  }
}

const startRefundOverpaid = async () => {
  if (ticketClone.value.paid < money.value) {
    return AlertStore.addError('Số tiền hoàn trả không hợp lệ')
  }
  paymentLoading.value = true
  try {
    await TicketClinicApi.refundOverpaid(ticketClone.value.id, money.value)
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
    await TicketClinicApi.payDebt(ticketClone.value.id, money.value)
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
          Thông tin thanh toán: {{ ticketClone.customer?.fullName }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <CloseOutlined />
        </div>
      </div>

      <div class="p-4">
        <div class="text-right">
          <span class="mr-2">Tổng chi phí:</span>
          <span class="font-bold" style="font-size: 16px">
            {{ formatMoney(ticketClone.totalMoney) }}
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
              <tr v-for="(customerPayment, index) in ticketClone.customerPaymentList" :key="index">
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
                <td class="text-right font-bold">{{ formatMoney(ticketClone.paid) }}</td>
              </tr>
              <tr v-if="ticketClone.ticketStatus !== TicketStatus.Completed">
                <td colspan="3" class="text-right">
                  <span v-if="ticketClone.debt >= 0">Đang thiếu:</span>
                  <span v-else>Đang thừa :</span>
                </td>
                <td class="text-right font-bold">{{ formatMoney(Math.abs(ticketClone.debt)) }}</td>
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
                      @click="money = ticketClone.debt > 0 ? ticketClone.debt : 0">
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
              <tr v-if="ticketClone.debt - money >= 0">
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">Còn thiếu :</td>
                <td class="w-full font-bold text-right pr-3" style="font-size: 16px">
                  {{ formatMoney(ticketClone.debt - money) }}
                </td>
              </tr>
              <tr v-else style="color: var(--text-red)">
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">Thừa :</td>
                <td class="w-full font-bold text-right pr-3" style="font-size: 16px">
                  {{ formatMoney(money - ticketClone.debt) }}
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
                    <VueButton type="button" @click="money = ticketClone.debt">Tất cả</VueButton>
                    <div class="flex-1">
                      <InputMoney
                        ref="inputMoneyPayment"
                        v-model:value="money"
                        :validate="{ gt: 0, lte: ticketClone.debt }"
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
                  {{ formatMoney(ticketClone.debt - money) }}
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
                    <VueButton type="button" @click="money = -ticketClone.debt">Tất cả</VueButton>
                    <div class="flex-1">
                      <InputMoney
                        ref="inputMoneyPayment"
                        v-model:value="money"
                        :validate="{ gt: 0, lte: ticketClone.paid }"
                        text-align="right" />
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td class="py-1"></td>
                <td></td>
              </tr>
              <tr v-if="ticketClone.paid - ticketClone.totalMoney > money">
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">Còn thừa</td>
                <td class="w-full font-bold text-right pr-3" style="font-size: 16px">
                  {{ formatMoney(ticketClone.paid - ticketClone.totalMoney - money) }}
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
