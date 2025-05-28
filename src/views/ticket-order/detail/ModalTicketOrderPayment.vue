<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputMoney, InputSelect, InputText } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { nextTick, ref } from 'vue'
import { IconClose } from '../../../common/icon-antd'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { PaymentMethodService, type PaymentMethod } from '../../../modules/payment-method'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { TicketStatus } from '../../../modules/ticket'
import { TicketOrderApi } from '../../../modules/ticket-order'
import { ESArray } from '../../../utils'
import TicketPaymentList from '../../ticket-base/TicketPaymentList.vue'
import { PaymentViewType, ticketOrderDetailRef } from './ticket-order-detail.ref'

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
const note = ref('')
const paymentMethodOptions = ref<{ value: any; label: string }[]>([])
const paymentMethodMap = ref<Record<string, PaymentMethod>>({})

const openModal = async (view = PaymentViewType.Success) => {
  showModal.value = true
  paymentView.value = view
  money.value = 0

  const paymentMethodAll = await PaymentMethodService.list({ sort: { priority: 'ASC' } })
  paymentMethodMap.value = ESArray.arrayToKeyValue(paymentMethodAll, 'id')
  paymentMethodOptions.value = paymentMethodAll.map((i) => ({ value: i.id, label: i.name }))
  paymentMethodId.value = paymentMethodAll[0]?.id || 0

  if (!isMobile) {
    nextTick(() => inputMoneyPayment.value?.focus())
  }
}

const closeModal = () => {
  showModal.value = false
  money.value = 0
  note.value = ''
  paymentMethodId.value = 0
  paymentMethodOptions.value = []
}

const startPrepayment = async () => {
  try {
    if (money.value <= 0) {
      return AlertStore.addError('Số tiền không hợp lệ')
    }
    paymentLoading.value = true
    const response = await TicketOrderApi.prepayment({
      ticketId: ticketOrderDetailRef.value.id,
      money: money.value,
      note: note.value,
      paymentMethodId: paymentMethodId.value,
    })
    Object.assign(ticketOrderDetailRef.value, response.ticket)
    ticketOrderDetailRef.value.customerPaymentList =
      ticketOrderDetailRef.value.customerPaymentList || []
    ticketOrderDetailRef.value.customerPaymentList.push(response.customerPayment)

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
    if (
      money.value < 0 ||
      ticketOrderDetailRef.value.totalMoney < ticketOrderDetailRef.value.paid + money.value
    ) {
      return AlertStore.addError('Số tiền không hợp lệ')
    }
    const response = await TicketOrderApi.sendProductAndPaymentAndClose({
      ticketId: ticketOrderDetailRef.value.id,
      money: money.value,
      paymentMethodId: paymentMethodId.value,
      note: note.value,
    })
    Object.assign(ticketOrderDetailRef.value, response.ticket)
    ticketOrderDetailRef.value.ticketProductList = response.ticketProductList
    ticketOrderDetailRef.value.customerPaymentList =
      ticketOrderDetailRef.value.customerPaymentList || []
    if (response.customerPayment) {
      ticketOrderDetailRef.value.customerPaymentList.push(response.customerPayment!)
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
    if (
      money.value < 0 ||
      ticketOrderDetailRef.value.totalMoney < ticketOrderDetailRef.value.paid + money.value
    ) {
      return AlertStore.addError('Số tiền không hợp lệ')
    }
    const response = await TicketOrderApi.paymentAndClose({
      ticketId: ticketOrderDetailRef.value.id,
      money: money.value,
      paymentMethodId: paymentMethodId.value,
      note: note.value,
    })
    Object.assign(ticketOrderDetailRef.value, response.ticket)
    ticketOrderDetailRef.value.customerPaymentList =
      ticketOrderDetailRef.value.customerPaymentList || []
    ticketOrderDetailRef.value.customerPaymentList.push(response.customerPayment!)

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
    if (
      money.value <= 0 ||
      ticketOrderDetailRef.value.totalMoney > ticketOrderDetailRef.value.paid - money.value
    ) {
      return AlertStore.addError('Số tiền không hợp lệ')
    }
    const response = await TicketOrderApi.refundOverpaid({
      ticketId: ticketOrderDetailRef.value.id,
      money: money.value,
      paymentMethodId: paymentMethodId.value,
      note: note.value,
    })
    Object.assign(ticketOrderDetailRef.value, response.ticket)
    ticketOrderDetailRef.value.customerPaymentList =
      ticketOrderDetailRef.value.customerPaymentList || []
    ticketOrderDetailRef.value.customerPaymentList.push(response.customerPayment)

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
    if (
      money.value <= 0 ||
      ticketOrderDetailRef.value.totalMoney < ticketOrderDetailRef.value.paid + money.value
    ) {
      return AlertStore.addError('Số tiền không hợp lệ')
    }
    const response = await TicketOrderApi.payDebt({
      ticketId: ticketOrderDetailRef.value.id,
      money: money.value,
      paymentMethodId: paymentMethodId.value,
      note: note.value,
    })
    Object.assign(ticketOrderDetailRef.value, response.ticket)
    ticketOrderDetailRef.value.customerPaymentList =
      ticketOrderDetailRef.value.customerPaymentList || []
    ticketOrderDetailRef.value.customerPaymentList.push(response.customerPayment)

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
  <VueModal v-model:show="showModal" style="width: 800px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Thông tin thanh toán</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <TicketPaymentList :ticket="ticketOrderDetailRef" :payment-method-map="paymentMethodMap" />
      </div>

      <!-- Prepayment -->
      <form
        class="p-4"
        v-if="paymentView == PaymentViewType.Prepayment"
        @submit.prevent="(e) => startPrepayment()"
      >
        <div class="flex flex-wrap gap-4">
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <div>
              <div>Phương thức thanh toán</div>
              <div>
                <InputSelect v-model:value="paymentMethodId" :options="paymentMethodOptions" />
              </div>
            </div>
            <div class="mt-4">
              <div>Ghi chú</div>
              <div>
                <InputText v-model:value="note" />
              </div>
            </div>
          </div>
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <div class="">
              <div class="flex flex-wrap justify-between">
                <span>Số tiền thanh toán</span>
              </div>
              <div>
                <div class="flex">
                  <VueButton
                    color="default"
                    type="button"
                    @click="money = ticketOrderDetailRef.debt > 0 ? ticketOrderDetailRef.debt : 0"
                  >
                    Tất cả
                  </VueButton>
                  <InputMoney
                    ref="inputMoneyPayment"
                    v-model:value="money"
                    text-align="right"
                    :validate="{ gt: 0 }"
                  />
                </div>
              </div>
            </div>
            <div class="mt-4">
              <div v-if="ticketOrderDetailRef.totalMoney >= ticketOrderDetailRef.paid + money">
                Còn thiếu
              </div>
              <div v-else>Còn thừa</div>
              <div>
                <InputMoney
                  :value="
                    Math.abs(ticketOrderDetailRef.totalMoney - (ticketOrderDetailRef.paid + money))
                  "
                  disabled
                  textAlign="right"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="mt-8 pb-4 flex justify-center gap-4">
          <div>
            <VueButton type="button" icon="close" @click="closeModal">Đóng lại</VueButton>
          </div>
          <div
            v-if="
              permissionIdMap[PermissionId.TICKET_ORDER_PREPAYMENT] &&
              [TicketStatus.Draft, TicketStatus.Deposited, TicketStatus.Executing].includes(
                ticketOrderDetailRef.ticketStatus,
              )
            "
          >
            <VueButton type="submit" color="blue" icon="dollar" :loading="paymentLoading">
              Tạm ứng
            </VueButton>
          </div>
        </div>
      </form>

      <!-- SendProductAndPaymentAndClose -->
      <form
        class="p-4"
        v-else-if="paymentView == PaymentViewType.SendProductAndPaymentAndClose"
        @submit.prevent="(e) => startSendProductAndPaymentAndClose()"
      >
        <div class="flex flex-wrap gap-4">
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <div>
              <div>Phương thức thanh toán</div>
              <div>
                <InputSelect v-model:value="paymentMethodId" :options="paymentMethodOptions" />
              </div>
            </div>
            <div class="mt-4">
              <div>Ghi chú</div>
              <div>
                <InputText v-model:value="note" />
              </div>
            </div>
          </div>
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <div class="">
              <div class="flex flex-wrap justify-between">
                <span>Số tiền thanh toán</span>
              </div>
              <div>
                <div class="flex">
                  <VueButton
                    color="default"
                    type="button"
                    @click="money = ticketOrderDetailRef.totalMoney - ticketOrderDetailRef.paid"
                  >
                    Tất cả
                  </VueButton>
                  <InputMoney
                    ref="inputMoneyPayment"
                    v-model:value="money"
                    text-align="right"
                    :validate="{
                      gte: 0,
                      lte: ticketOrderDetailRef.totalMoney - ticketOrderDetailRef.paid,
                    }"
                  />
                </div>
              </div>
            </div>
            <div class="mt-4">
              <div>Ghi nợ</div>
              <div>
                <InputMoney
                  :value="ticketOrderDetailRef.totalMoney - (ticketOrderDetailRef.paid + money)"
                  disabled
                  textAlign="right"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="mt-8 pb-4 flex justify-center gap-4">
          <div>
            <VueButton type="button" icon="close" @click="closeModal">Đóng lại</VueButton>
          </div>
          <div
            v-if="
              permissionIdMap[PermissionId.TICKET_ORDER_SEND_PRODUCT] &&
              permissionIdMap[PermissionId.TICKET_ORDER_PAYMENT_AND_CLOSE] &&
              [TicketStatus.Draft, TicketStatus.Deposited].includes(
                ticketOrderDetailRef.ticketStatus,
              )
            "
          >
            <VueButton type="submit" color="blue" icon="dollar" :loading="paymentLoading">
              <template
                v-if="ticketOrderDetailRef.totalMoney === ticketOrderDetailRef.paid + money"
              >
                Gửi hàng và Thanh toán
              </template>
              <template v-if="ticketOrderDetailRef.totalMoney != ticketOrderDetailRef.paid + money">
                Gửi hàng và Ghi nợ
              </template>
            </VueButton>
          </div>
        </div>
      </form>

      <!-- PaymentAndClose -->
      <form
        class="p-4"
        v-else-if="paymentView == PaymentViewType.PaymentAndClose"
        @submit.prevent="(e) => startPaymentAndClose()"
      >
        <div class="flex flex-wrap gap-4">
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <div>
              <div>Phương thức thanh toán</div>
              <div>
                <InputSelect v-model:value="paymentMethodId" :options="paymentMethodOptions" />
              </div>
            </div>
            <div class="mt-4">
              <div>Ghi chú</div>
              <div>
                <InputText v-model:value="note" />
              </div>
            </div>
          </div>
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <div class="">
              <div class="flex flex-wrap justify-between">
                <span>Số tiền thanh toán</span>
              </div>
              <div>
                <div class="flex">
                  <VueButton
                    color="default"
                    type="button"
                    @click="money = ticketOrderDetailRef.totalMoney - ticketOrderDetailRef.paid"
                  >
                    Tất cả
                  </VueButton>
                  <InputMoney
                    ref="inputMoneyPayment"
                    v-model:value="money"
                    text-align="right"
                    :validate="{
                      gte: 0,
                      lte: ticketOrderDetailRef.totalMoney - ticketOrderDetailRef.paid,
                    }"
                  />
                </div>
              </div>
            </div>
            <div class="mt-4">
              <div>Ghi nợ</div>
              <div>
                <InputMoney
                  :value="ticketOrderDetailRef.totalMoney - (ticketOrderDetailRef.paid + money)"
                  disabled
                  textAlign="right"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="mt-8 pb-4 flex justify-center gap-4">
          <div>
            <VueButton type="button" icon="close" @click="closeModal">Đóng lại</VueButton>
          </div>
          <div
            v-if="
              permissionIdMap[PermissionId.TICKET_ORDER_SEND_PRODUCT] &&
              permissionIdMap[PermissionId.TICKET_ORDER_PAYMENT_AND_CLOSE] &&
              [TicketStatus.Draft, TicketStatus.Deposited].includes(
                ticketOrderDetailRef.ticketStatus,
              )
            "
          >
            <VueButton type="submit" color="blue" icon="dollar" :loading="paymentLoading">
              <template
                v-if="ticketOrderDetailRef.totalMoney === ticketOrderDetailRef.paid + money"
              >
                Gửi hàng và Thanh toán
              </template>
              <template v-if="ticketOrderDetailRef.totalMoney != ticketOrderDetailRef.paid + money">
                Gửi hàng và Ghi nợ
              </template>
            </VueButton>
          </div>
        </div>
      </form>

      <!-- RefundOverpaid -->
      <form
        class="p-4"
        v-else-if="paymentView == PaymentViewType.RefundOverpaid"
        @submit.prevent="(e) => startRefundOverpaid()"
      >
        <div class="flex flex-wrap gap-4">
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <div>
              <div>Phương thức hoàn trả</div>
              <div>
                <InputSelect v-model:value="paymentMethodId" :options="paymentMethodOptions" />
              </div>
            </div>
            <div class="mt-4">
              <div>Ghi chú</div>
              <div>
                <InputText v-model:value="note" />
              </div>
            </div>
          </div>
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <div class="">
              <div class="flex flex-wrap justify-between">
                <span>Số tiền hoàn trả</span>
              </div>
              <div>
                <div class="flex">
                  <VueButton
                    color="default"
                    type="button"
                    @click="money = ticketOrderDetailRef.paid - ticketOrderDetailRef.totalMoney"
                  >
                    Tất cả
                  </VueButton>
                  <InputMoney
                    ref="inputMoneyPayment"
                    v-model:value="money"
                    text-align="right"
                    :validate="{
                      gt: 0,
                      lte: ticketOrderDetailRef.paid - ticketOrderDetailRef.totalMoney,
                    }"
                  />
                </div>
              </div>
            </div>
            <div class="mt-4">
              <div>Còn thừa</div>
              <div>
                <InputMoney
                  :value="ticketOrderDetailRef.paid - money - ticketOrderDetailRef.totalMoney"
                  disabled
                  textAlign="right"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="mt-8 pb-4 flex justify-center gap-4">
          <div>
            <VueButton type="button" icon="close" @click="closeModal">Đóng lại</VueButton>
          </div>
          <div
            v-if="
              permissionIdMap[PermissionId.TICKET_ORDER_REFUND_OVERPAID] &&
              [TicketStatus.Deposited, TicketStatus.Executing].includes(
                ticketOrderDetailRef.ticketStatus,
              )
            "
          >
            <VueButton type="submit" color="blue" icon="dollar" :loading="paymentLoading">
              <span v-if="ticketOrderDetailRef.totalMoney != ticketOrderDetailRef.paid - money">
                Hoàn trả tiền
              </span>
              <span v-if="ticketOrderDetailRef.totalMoney === ticketOrderDetailRef.paid - money">
                Hoàn tiền và Kết thúc
              </span>
            </VueButton>
          </div>
        </div>
      </form>

      <!-- PayDebt -->
      <form
        class="p-4"
        v-else-if="paymentView == PaymentViewType.PayDebt"
        @submit.prevent="(e) => startPayDebt()"
      >
        <div class="flex flex-wrap gap-4">
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <div>
              <div>Phương thức thanh toán</div>
              <div>
                <InputSelect v-model:value="paymentMethodId" :options="paymentMethodOptions" />
              </div>
            </div>
            <div class="mt-4">
              <div>Ghi chú</div>
              <div>
                <InputText v-model:value="note" />
              </div>
            </div>
          </div>
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <div class="">
              <div class="flex flex-wrap justify-between">
                <span>Số tiền thanh toán</span>
              </div>
              <div>
                <div class="flex">
                  <VueButton
                    color="default"
                    type="button"
                    @click="money = ticketOrderDetailRef.totalMoney - ticketOrderDetailRef.paid"
                  >
                    Tất cả
                  </VueButton>
                  <InputMoney
                    ref="inputMoneyPayment"
                    v-model:value="money"
                    text-align="right"
                    :validate="{
                      gt: 0,
                      lte: ticketOrderDetailRef.totalMoney - ticketOrderDetailRef.paid,
                    }"
                  />
                </div>
              </div>
            </div>
            <div class="mt-4">
              <div>Nợ còn</div>
              <div>
                <InputMoney
                  :value="ticketOrderDetailRef.totalMoney - ticketOrderDetailRef.paid - money"
                  disabled
                  textAlign="right"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="mt-8 pb-4 flex justify-center gap-4">
          <div>
            <VueButton type="button" icon="close" @click="closeModal">Đóng lại</VueButton>
          </div>
          <div
            v-if="
              permissionIdMap[PermissionId.TICKET_ORDER_PAY_DEBT] &&
              [TicketStatus.Debt].includes(ticketOrderDetailRef.ticketStatus)
            "
          >
            <VueButton type="submit" color="blue" icon="dollar" :loading="paymentLoading">
              <template
                v-if="ticketOrderDetailRef.totalMoney === ticketOrderDetailRef.paid + money"
              >
                Trả nợ và Hoàn thành
              </template>
              <template v-if="ticketOrderDetailRef.totalMoney != ticketOrderDetailRef.paid + money">
                Trả nợ
              </template>
            </VueButton>
          </div>
        </div>
      </form>

      <div v-else class="mt-4 pb-4 flex justify-center gap-4">
        <VueButton type="button" @click="closeModal" icon="close">Đóng lại</VueButton>
      </div>
    </div>
  </VueModal>
</template>
