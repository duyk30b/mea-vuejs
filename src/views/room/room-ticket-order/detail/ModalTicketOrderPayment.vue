<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputMoney, InputText } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { PaymentViewType } from '@/modules/enum'
import { PaymentActionType } from '@/modules/payment'
import { PermissionId } from '@/modules/permission/permission.enum'
import { TicketMoneyApi, TicketOrderApi, TicketStatus } from '@/modules/ticket'
import { TicketProduct } from '@/modules/ticket-product'
import InputSelectWallet from '@/views/component/InputSelectWallet.vue'
import TicketPaymentList from '@/views/room/room-ticket-base/TicketPaymentList.vue'
import { ref } from 'vue'
import { ticketOrderDetailRef } from './ticket-order-detail.ref'

const inputMoneyPayment = ref<InstanceType<typeof InputMoney>>()
const emit = defineEmits<{ (e: 'success'): void }>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

const showModal = ref(false)
const paymentLoading = ref(false)

const paymentView = ref(PaymentViewType.Success)

const money = ref(0)
const walletId = ref<string>('')
const note = ref('')

const openModal = async (view = PaymentViewType.Success) => {
  showModal.value = true
  paymentView.value = view
  money.value = 0
}

const closeModal = () => {
  showModal.value = false
  money.value = 0
  note.value = ''
  walletId.value = ''
}

const startPrepayment = async () => {
  try {
    if (money.value <= 0) {
      return AlertStore.addError('Số tiền không hợp lệ')
    }
    paymentLoading.value = true
    const result = await TicketMoneyApi.paymentMoney({
      ticketId: ticketOrderDetailRef.value.id,
      body: {
        walletId: walletId.value,
        paymentActionType: PaymentActionType.PaymentMoney,
        paidAdd: money.value,
        paidItemAdd: 0,
        debtAdd: 0,
        debtItemAdd: 0,
        note: '',
      },
    })
    Object.assign(ticketOrderDetailRef.value, result.ticketModified)
    ticketOrderDetailRef.value.paymentList!.push(result.paymentCreated)

    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ ModalTicketOrderPayment.vue:85 ~ startPrepayment ~ error:', error)
  } finally {
    paymentLoading.value = false
  }
}

const startSendProductAndPaymentAndClose = async () => {
  try {
    paymentLoading.value = true
    if (
      money.value < 0 ||
      ticketOrderDetailRef.value.totalMoney < ticketOrderDetailRef.value.paidAmount + money.value
    ) {
      return AlertStore.addError('Số tiền không hợp lệ')
    }
    const response = await TicketOrderApi.sendProductAndPaymentAndClose(
      ticketOrderDetailRef.value.id,
      {
        customerId: ticketOrderDetailRef.value.customerId,
        paidAmount: money.value,
        walletId: walletId.value,
        note: note.value,
        ticketProductIdList: (ticketOrderDetailRef.value.ticketProductList || []).map((i: any) => {
          return i.id
        }),
      },
    )
    Object.assign(ticketOrderDetailRef.value, response.ticketModified)
    ticketOrderDetailRef.value.paymentList?.push(...response.paymentCreatedList)
    ticketOrderDetailRef.value.ticketProductList = TicketProduct.updateListByPartialList(
      ticketOrderDetailRef.value.ticketProductList || [],
      response.ticketProductModifiedAll,
    )
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ ModalTicketOrderPayment.vue:116 ~ SendProductAndPaymentAndClose :', error)
  } finally {
    paymentLoading.value = false
  }
}

const startRefundOverpaid = async () => {
  try {
    paymentLoading.value = true
    if (
      money.value <= 0 ||
      ticketOrderDetailRef.value.totalMoney > ticketOrderDetailRef.value.paidAmount - money.value
    ) {
      return AlertStore.addError('Số tiền không hợp lệ')
    }

    const result = await TicketMoneyApi.paymentMoney({
      ticketId: ticketOrderDetailRef.value.id,
      body: {
        walletId: walletId.value,
        paymentActionType: PaymentActionType.RefundMoney,
        note: '',
        paidAdd: -money.value,
        paidItemAdd: 0,
        debtAdd: 0,
        debtItemAdd: 0,
      },
    })
    Object.assign(ticketOrderDetailRef.value, result.ticketModified)
    ticketOrderDetailRef.value.paymentList!.push(result.paymentCreated)

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
      ticketOrderDetailRef.value.totalMoney < ticketOrderDetailRef.value.paidAmount + money.value
    ) {
      return AlertStore.addError('Số tiền không hợp lệ')
    }

    const result = await TicketMoneyApi.paymentMoney({
      ticketId: ticketOrderDetailRef.value.id,
      body: {
        walletId: walletId.value,
        paymentActionType: PaymentActionType.PayDebt,
        note: '',
        paidAdd: money.value,
        paidItemAdd: 0,
        debtAdd: -money.value,
        debtItemAdd: 0,
      },
    })
    Object.assign(ticketOrderDetailRef.value, result.ticketModified)
    ticketOrderDetailRef.value.paymentList!.push(result.paymentCreated)

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
        <TicketPaymentList :ticket="ticketOrderDetailRef" />
      </div>

      <!-- RefundOverpaid -->
      <form
        class="p-4"
        v-if="paymentView == PaymentViewType.RefundOverpaid"
        @submit.prevent="(e) => startRefundOverpaid()"
      >
        <div class="flex flex-wrap gap-4">
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <div>
              <div>Phương thức hoàn trả</div>
              <div>
                <InputSelectWallet v-model:walletId="walletId" required autoSelectFirstValue />
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
                    @click="
                      money = ticketOrderDetailRef.paidAmount - ticketOrderDetailRef.totalMoney
                    "
                  >
                    Tất cả
                  </VueButton>
                  <InputMoney
                    ref="inputMoneyPayment"
                    v-model:value="money"
                    text-align="right"
                    :validate="{
                      gt: 0,
                      lte: ticketOrderDetailRef.paidAmount - ticketOrderDetailRef.totalMoney,
                    }"
                  />
                </div>
              </div>
            </div>
            <div class="mt-4">
              <div>Còn thừa</div>
              <div>
                <InputMoney
                  :value="ticketOrderDetailRef.paidAmount - money - ticketOrderDetailRef.totalMoney"
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
              userPermission[PermissionId.TICKET_REFUND_MONEY] &&
              [TicketStatus.Deposited, TicketStatus.Executing].includes(ticketOrderDetailRef.status)
            "
          >
            <VueButton type="submit" color="blue" icon="dollar" :loading="paymentLoading">
              <span>Hoàn trả tiền</span>
            </VueButton>
          </div>
        </div>
      </form>

      <!-- Prepayment -->
      <form
        class="p-4"
        v-else-if="paymentView == PaymentViewType.Prepayment"
        @submit.prevent="(e) => startPrepayment()"
      >
        <div class="flex flex-wrap gap-4">
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <div>
              <div>Phương thức thanh toán</div>
              <div>
                <InputSelectWallet v-model:walletId="walletId" required autoSelectFirstValue />
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
                <span>Tạm ứng lần này</span>
              </div>
              <div>
                <div class="flex">
                  <VueButton
                    color="default"
                    type="button"
                    @click="
                      money = ticketOrderDetailRef.totalMoney - ticketOrderDetailRef.paidAmount
                    "
                  >
                    Tất cả
                  </VueButton>
                  <InputMoney
                    ref="inputMoneyPayment"
                    v-model:value="money"
                    text-align="right"
                    :validate="
                      ticketOrderDetailRef.status === TicketStatus.Draft ? { gte: 0 } : { gt: 0 }
                    "
                  />
                </div>
              </div>
            </div>
            <div class="mt-4">
              <div
                v-if="ticketOrderDetailRef.totalMoney >= ticketOrderDetailRef.paidAmount + money"
              >
                Còn thiếu
              </div>
              <div v-else>Còn thừa</div>
              <div>
                <InputMoney
                  :value="
                    Math.abs(
                      ticketOrderDetailRef.totalMoney - (ticketOrderDetailRef.paidAmount + money),
                    )
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
              userPermission[PermissionId.TICKET_PAYMENT_MONEY] &&
              [TicketStatus.Draft, TicketStatus.Deposited, TicketStatus.Executing].includes(
                ticketOrderDetailRef.status,
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
                <InputSelectWallet v-model:walletId="walletId" required autoSelectFirstValue />
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
                    @click="
                      money = ticketOrderDetailRef.totalMoney - ticketOrderDetailRef.paidAmount
                    "
                  >
                    Tất cả
                  </VueButton>
                  <InputMoney
                    ref="inputMoneyPayment"
                    v-model:value="money"
                    text-align="right"
                    :validate="{
                      gte: 0,
                      lte: ticketOrderDetailRef.totalMoney - ticketOrderDetailRef.paidAmount,
                    }"
                  />
                </div>
              </div>
            </div>
            <div class="mt-4">
              <div>Ghi nợ</div>
              <div>
                <InputMoney
                  :value="
                    ticketOrderDetailRef.totalMoney - (ticketOrderDetailRef.paidAmount + money)
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
              userPermission[PermissionId.TICKET_CHANGE_PRODUCT_SEND_PRODUCT] &&
              userPermission[PermissionId.TICKET_PAYMENT_MONEY] &&
              userPermission[PermissionId.TICKET_CLOSE] &&
              [TicketStatus.Draft].includes(ticketOrderDetailRef.status)
            "
          >
            <VueButton type="submit" color="blue" icon="dollar" :loading="paymentLoading">
              <template
                v-if="ticketOrderDetailRef.totalMoney === ticketOrderDetailRef.paidAmount + money"
              >
                Gửi hàng và Thanh toán
              </template>
              <template
                v-if="ticketOrderDetailRef.totalMoney != ticketOrderDetailRef.paidAmount + money"
              >
                Gửi hàng và Ghi nợ
              </template>
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
                <InputSelectWallet v-model:walletId="walletId" required autoSelectFirstValue />
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
                    @click="
                      money = ticketOrderDetailRef.totalMoney - ticketOrderDetailRef.paidAmount
                    "
                  >
                    Tất cả
                  </VueButton>
                  <InputMoney
                    ref="inputMoneyPayment"
                    v-model:value="money"
                    text-align="right"
                    :validate="{
                      gt: 0,
                      lte: ticketOrderDetailRef.totalMoney - ticketOrderDetailRef.paidAmount,
                    }"
                  />
                </div>
              </div>
            </div>
            <div class="mt-4">
              <div>Nợ còn</div>
              <div>
                <InputMoney
                  :value="ticketOrderDetailRef.totalMoney - ticketOrderDetailRef.paidAmount - money"
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
              userPermission[PermissionId.TICKET_PAYMENT_MONEY] &&
              [TicketStatus.Debt].includes(ticketOrderDetailRef.status)
            "
          >
            <VueButton type="submit" color="blue" icon="dollar" :loading="paymentLoading">
              <template
                v-if="ticketOrderDetailRef.totalMoney === ticketOrderDetailRef.paidAmount + money"
              >
                Trả nợ và Kết thúc
              </template>
              <template
                v-if="ticketOrderDetailRef.totalMoney != ticketOrderDetailRef.paidAmount + money"
              >
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
