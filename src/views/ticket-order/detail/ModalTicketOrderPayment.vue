<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputMoney } from '@/common/vue-form'
import { CloseOutlined } from '@ant-design/icons-vue'
import { nextTick, ref } from 'vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { TicketStatus } from '../../../modules/ticket'
import { timeToText } from '../../../utils'
import CustomerPaymentTypeTag from '../../customer/CustomerPaymentTypeTag.vue'
import { PaymentViewType, ticket } from './ticket-order-detail.ref'
import { TicketOrderApi } from '../../../modules/ticket-order'

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

const startPrepayment = async () => {
  try {
    if (money.value <= 0) {
      return AlertStore.addError('Số tiền không hợp lệ')
    }
    paymentLoading.value = true
    const response = await TicketOrderApi.prepayment({
      ticketId: ticket.value.id,
      money: money.value,
    })
    Object.assign(ticket.value, response.ticket)
    ticket.value.customerPaymentList = ticket.value.customerPaymentList || []
    ticket.value.customerPaymentList.push(response.customerPayment)

    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:61 ~ startPrepayment ~ error:', error)
  } finally {
    paymentLoading.value = false
  }
}

const startSendProductAndPaymentAndClose = async () => {
  try {
    paymentLoading.value = true
    if (money.value < 0 || ticket.value.totalMoney < ticket.value.paid + money.value) {
      return AlertStore.addError('Số tiền không hợp lệ')
    }
    const response = await TicketOrderApi.sendProductAndPaymentAndClose({
      ticketId: ticket.value.id,
      money: money.value,
    })
    Object.assign(ticket.value, response.ticket)
    ticket.value.ticketProductList = response.ticketProductList
    ticket.value.customerPaymentList = ticket.value.customerPaymentList || []
    if (response.customerPayment) {
      ticket.value.customerPaymentList.push(response.customerPayment!)
    }

    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:107 ~ handlePayment ~ error:', error)
  } finally {
    paymentLoading.value = false
  }
}

const startPaymentAndClose = async () => {
  try {
    paymentLoading.value = true
    if (money.value < 0 || ticket.value.totalMoney < ticket.value.paid + money.value) {
      return AlertStore.addError('Số tiền không hợp lệ')
    }
    const response = await TicketOrderApi.paymentAndClose({
      ticketId: ticket.value.id,
      money: money.value,
    })
    Object.assign(ticket.value, response.ticket)
    ticket.value.customerPaymentList = ticket.value.customerPaymentList || []
    ticket.value.customerPaymentList.push(response.customerPayment!)

    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:107 ~ handlePayment ~ error:', error)
  } finally {
    paymentLoading.value = false
  }
}

const startRefundOverpaid = async () => {
  try {
    paymentLoading.value = true
    if (money.value <= 0 || ticket.value.totalMoney > ticket.value.paid - money.value) {
      return AlertStore.addError('Số tiền không hợp lệ')
    }
    const response = await TicketOrderApi.refundOverpaid({
      ticketId: ticket.value.id,
      money: money.value,
    })
    Object.assign(ticket.value, response.ticket)
    ticket.value.customerPaymentList = ticket.value.customerPaymentList || []
    ticket.value.customerPaymentList.push(response.customerPayment)

    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:84 ~ startRefundOverpaid ~ error:', error)
  } finally {
    paymentLoading.value = false
  }
}

const startPayDebt = async () => {
  try {
    paymentLoading.value = true
    if (money.value <= 0 || ticket.value.totalMoney < ticket.value.paid + money.value) {
      return AlertStore.addError('Số tiền không hợp lệ')
    }
    const response = await TicketOrderApi.payDebt({
      ticketId: ticket.value.id,
      money: money.value,
    })
    Object.assign(ticket.value, response.ticket)
    ticket.value.customerPaymentList = ticket.value.customerPaymentList || []
    ticket.value.customerPaymentList.push(response.customerPayment)

    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:130 ~ handlePayment ~ error:', error)
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
          <span class="mr-2">Tổng tiền đơn:</span>
          <span class="pr-4 font-bold" style="font-size: 16px">
            {{ formatMoney(ticket.totalMoney) }}
          </span>
        </div>
        <div class="mt-2 table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Thời gian</th>
                <th>Loại</th>
                <th>T.Toán</th>
                <th>Ghi nợ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(customerPayment, index) in ticket.customerPaymentList" :key="index">
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
                  <div
                    v-if="customerPayment.description"
                    style="font-size: 0.8rem; font-style: italic">
                    {{ customerPayment.description }}
                  </div>
                </td>
                <td>
                  <CustomerPaymentTypeTag :paymentType="customerPayment.paymentType" />
                </td>
                <td class="text-right">
                  <div>{{ formatMoney(customerPayment.paid) }}</div>
                </td>
                <td class="text-right">
                  <div>{{ formatMoney(customerPayment.debit) }}</div>
                </td>
              </tr>
              <tr>
                <td colspan="3" class="text-right">Tổng đã thanh toán :</td>
                <td class="text-right font-bold">{{ formatMoney(ticket.paid) }}</td>
                <td></td>
              </tr>
              <tr v-if="ticket.ticketStatus !== TicketStatus.Cancelled">
                <td colspan="3" class="text-right">
                  <span v-if="paymentView == PaymentViewType.PayDebt">Đang nợ :</span>
                  <span v-else-if="ticket.paid > ticket.totalMoney">Đang thừa :</span>
                  <span v-else-if="ticket.paid <= ticket.totalMoney">Đang thiếu :</span>
                </td>
                <td></td>
                <td class="text-right font-bold">
                  {{ formatMoney(Math.abs(ticket.totalMoney - ticket.paid)) }}
                  <!-- không tính theo debt được, vì cancel thì debt = 0 -->
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Prepayment -->
      <form
        v-if="paymentView == PaymentViewType.Prepayment"
        @submit.prevent="(e) => startPrepayment()">
        <div class="px-4">
          <table class="w-full">
            <tbody>
              <tr>
                <td class="py-1"></td>
                <td></td>
              </tr>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap; width: 30%">
                  Tạm ứng lần này :
                </td>
                <td>
                  <div class="flex items-stretch pl-6">
                    <VueButton
                      color="default"
                      type="button"
                      @click="money = ticket.totalMoney - ticket.paid">
                      Tất cả
                    </VueButton>
                    <div class="flex-1">
                      <InputMoney
                        ref="inputMoneyPayment"
                        v-model:value="money"
                        text-align="right"
                        :validate="{ gt: 0 }" />
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
                  <span v-if="ticket.totalMoney < ticket.paid + money">Thừa :</span>
                  <span v-else>Còn thiếu :</span>
                </td>
                <td class="w-full font-bold text-right pr-3" style="font-size: 16px">
                  {{ formatMoney(Math.abs(ticket.totalMoney - (ticket.paid + money))) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 pb-4 flex justify-center gap-4">
          <div>
            <VueButton type="button" icon="close" @click="closeModal">Đóng lại</VueButton>
          </div>
          <div
            v-if="
              permissionIdMap[PermissionId.TICKET_ORDER_PREPAYMENT] &&
              [
                TicketStatus.Draft,
                TicketStatus.Approved,
                TicketStatus.Draft,
                TicketStatus.Executing,
              ].includes(ticket.ticketStatus)
            ">
            <VueButton type="submit" color="blue" icon="dollar" :loading="paymentLoading">
              Tạm ứng
            </VueButton>
          </div>
        </div>
      </form>

      <!-- SendProductAndPaymentAndClose -->
      <form
        v-else-if="paymentView == PaymentViewType.SendProductAndPaymentAndClose"
        @submit.prevent="(e) => startSendProductAndPaymentAndClose()">
        <div class="px-4">
          <table class="w-full">
            <tbody>
              <tr>
                <td class="py-1"></td>
                <td></td>
              </tr>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap; width: 30%">
                  Thanh toán :
                </td>
                <td>
                  <div class="flex items-stretch pl-6">
                    <VueButton
                      color="default"
                      type="button"
                      @click="money = ticket.totalMoney - ticket.paid">
                      Tất cả
                    </VueButton>
                    <div class="flex-1">
                      <InputMoney
                        ref="inputMoneyPayment"
                        v-model:value="money"
                        text-align="right"
                        :validate="{ gte: 0, lte: ticket.totalMoney - ticket.paid }" />
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td class="py-1"></td>
                <td></td>
              </tr>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">Ghi nợ :</td>
                <td class="w-full font-bold text-right pr-3" style="font-size: 16px">
                  {{ formatMoney(ticket.totalMoney - (ticket.paid + money)) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 pb-4 flex justify-center gap-4">
          <div>
            <VueButton type="button" icon="close" @click="closeModal">Đóng lại</VueButton>
          </div>
          <div
            v-if="
              permissionIdMap[PermissionId.TICKET_ORDER_SEND_PRODUCT] &&
              permissionIdMap[PermissionId.TICKET_ORDER_PAYMENT_AND_CLOSE] &&
              [TicketStatus.Draft, TicketStatus.Approved].includes(ticket.ticketStatus)
            ">
            <VueButton type="submit" color="blue" icon="dollar" :loading="paymentLoading">
              <span v-if="ticket.totalMoney === ticket.paid + money">Gửi hàng và Thanh toán</span>
              <span v-if="ticket.totalMoney != ticket.paid + money">Gửi hàng và Ghi nợ</span>
            </VueButton>
          </div>
        </div>
      </form>

      <!-- PaymentAndClose -->
      <form
        v-else-if="paymentView == PaymentViewType.PaymentAndClose"
        @submit.prevent="(e) => startPaymentAndClose()">
        <div class="px-4">
          <table class="w-full">
            <tbody>
              <tr>
                <td class="py-1"></td>
                <td></td>
              </tr>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap; width: 30%">
                  Thanh toán :
                </td>
                <td>
                  <div class="flex items-stretch pl-6">
                    <VueButton
                      color="default"
                      type="button"
                      @click="money = ticket.totalMoney - ticket.paid">
                      Tất cả
                    </VueButton>
                    <div class="flex-1">
                      <InputMoney
                        ref="inputMoneyPayment"
                        v-model:value="money"
                        text-align="right"
                        :validate="{ gte: 0, lte: ticket.totalMoney - ticket.paid }" />
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td class="py-1"></td>
                <td></td>
              </tr>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">Ghi nợ :</td>
                <td class="w-full font-bold text-right pr-3" style="font-size: 16px">
                  {{ formatMoney(ticket.totalMoney - (ticket.paid + money)) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 pb-4 flex justify-center gap-4">
          <div>
            <VueButton type="button" icon="close" @click="closeModal">Đóng lại</VueButton>
          </div>
          <div
            v-if="
              permissionIdMap[PermissionId.TICKET_ORDER_PAYMENT_AND_CLOSE] &&
              [TicketStatus.Draft, TicketStatus.Approved].includes(ticket.ticketStatus)
            ">
            <VueButton type="submit" color="blue" icon="dollar" :loading="paymentLoading">
              <span v-if="ticket.totalMoney === ticket.paid + money">Thanh toán</span>
              <span v-if="ticket.totalMoney > ticket.paid + money">Thanh toán và Ghi nợ</span>
            </VueButton>
          </div>
        </div>
      </form>

      <!-- RefundOverpaid -->
      <form
        v-else-if="paymentView == PaymentViewType.RefundOverpaid"
        @submit.prevent="(e) => startRefundOverpaid()">
        <div class="px-4">
          <table class="w-full">
            <tbody>
              <tr>
                <td class="py-1"></td>
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
                      @click="money = ticket.paid - ticket.totalMoney">
                      Tất cả
                    </VueButton>
                    <div class="flex-1">
                      <InputMoney
                        ref="inputMoneyPayment"
                        v-model:value="money"
                        text-align="right"
                        :validate="{ gt: 0, lte: ticket.paid - ticket.totalMoney }" />
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td class="py-1"></td>
                <td></td>
              </tr>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap">Còn Thừa :</td>
                <td class="w-full font-bold text-right pr-3" style="font-size: 16px">
                  {{ formatMoney(ticket.paid - money - ticket.totalMoney) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 pb-4 flex justify-center gap-4">
          <div>
            <VueButton type="button" icon="close" @click="closeModal">Đóng lại</VueButton>
          </div>
          <div
            v-if="
              permissionIdMap[PermissionId.TICKET_ORDER_REFUND_OVERPAID] &&
              [TicketStatus.Approved, TicketStatus.Executing].includes(ticket.ticketStatus)
            ">
            <VueButton type="submit" color="blue" icon="dollar" :loading="paymentLoading">
              <span v-if="ticket.totalMoney != ticket.paid - money">Hoàn trả tiền</span>
              <span v-if="ticket.totalMoney === ticket.paid - money">Hoàn tiền và kết thúc</span>
            </VueButton>
          </div>
        </div>
      </form>

      <!-- PayDebt -->
      <form
        v-else-if="paymentView == PaymentViewType.PayDebt"
        @submit.prevent="(e) => startPayDebt()">
        <div class="px-4">
          <table class="w-full">
            <tbody>
              <tr>
                <td class="py-1"></td>
                <td></td>
              </tr>
              <tr>
                <td class="pr-4 py-2 text-right" style="white-space: nowrap; width: 30%">
                  Trả nợ :
                </td>
                <td>
                  <div class="flex items-stretch pl-6">
                    <VueButton
                      color="default"
                      type="button"
                      @click="money = ticket.totalMoney - ticket.paid">
                      Tất cả
                    </VueButton>
                    <div class="flex-1">
                      <InputMoney
                        ref="inputMoneyPayment"
                        v-model:value="money"
                        text-align="right"
                        :validate="{ gt: 0, lte: ticket.totalMoney - ticket.paid }" />
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
                  {{ formatMoney(ticket.totalMoney - ticket.paid - money) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 pb-4 flex justify-center gap-4">
          <div>
            <VueButton type="button" icon="close" @click="closeModal">Đóng lại</VueButton>
          </div>
          <div>
            <VueButton type="submit" icon="dollar" color="blue" :loading="paymentLoading">
              Trả nợ
            </VueButton>
          </div>
        </div>
      </form>

      <div v-else class="mt-4 pb-4 flex justify-center gap-4">
        <VueButton type="button" @click="closeModal">
          <CloseOutlined />
          Đóng lại
        </VueButton>
      </div>
    </div>
  </VueModal>
</template>
