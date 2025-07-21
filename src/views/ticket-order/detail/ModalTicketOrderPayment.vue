<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputMoney, InputSelect, InputText } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { PaymentApi } from '@/modules/payment'
import { PaymentVoucherItemType } from '@/modules/payment-item'
import { nextTick, onMounted, ref } from 'vue'
import { IconClose } from '../../../common/icon-antd'
import { MeService } from '../../../modules/_me/me.service'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { PaymentViewType } from '../../../modules/enum'
import { PaymentMethodService, type PaymentMethod } from '../../../modules/payment-method'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { TicketStatus } from '../../../modules/ticket'
import { TicketOrderApi } from '../../../modules/ticket-order'
import { ESArray } from '../../../utils'
import TicketPaymentList from '../../ticket-base/TicketPaymentList.vue'
import { ticketOrderDetailRef } from './ticket-order-detail.ref'
import { TicketProduct } from '@/modules/ticket-product'

const inputMoneyPayment = ref<InstanceType<typeof InputMoney>>()
const emit = defineEmits<{ (e: 'success'): void }>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

const showModal = ref(false)
const paymentLoading = ref(false)
const paymentView = ref(PaymentViewType.Success)

const money = ref(0)
const paymentMethodId = ref<number>(0)
const note = ref('')
const paymentMethodOptions = ref<{ value: any; label: string }[]>([])
const paymentMethodMap = ref<Record<string, PaymentMethod>>({})

onMounted(async () => {
  try {
    const paymentMethodAll = await PaymentMethodService.list({ sort: { priority: 'ASC' } })
    paymentMethodMap.value = ESArray.arrayToKeyValue(paymentMethodAll, 'id')
    paymentMethodOptions.value = paymentMethodAll.map((i) => ({ value: i.id, label: i.name }))
    paymentMethodId.value = paymentMethodAll[0]?.id || 0
  } catch (error) {
    console.log('🚀 ~ ModalReceiptPayment.vue:43 ~ openModal ~ error:', error)
  }
})

const openModal = async (view = PaymentViewType.Success) => {
  showModal.value = true
  paymentView.value = view
  money.value = 0
}

const closeModal = () => {
  showModal.value = false
  money.value = 0
  note.value = ''
  paymentMethodId.value = 0
}

const startPrepayment = async () => {
  try {
    if (money.value <= 0) {
      return AlertStore.addError('Số tiền không hợp lệ')
    }
    paymentLoading.value = true
    const result = await PaymentApi.customerPayment({
      body: {
        customerId: ticketOrderDetailRef.value.customerId,
        paymentMethodId: paymentMethodId.value,
        totalMoney: money.value,
        reason: 'Tạm ứng',
        note: '',
        paymentItemData: {
          moneyTopUpAdd: 0,
          payDebt: [],
          prepayment: {
            ticketId: ticketOrderDetailRef.value.id,
            itemList: [
              {
                amount: money.value,
                ticketItemId: 0,
                paymentInteractId: 0,
                voucherItemType: PaymentVoucherItemType.Other,
              },
            ],
          },
        },
      },
    })
    Object.assign(ticketOrderDetailRef.value, result.ticketModifiedList[0])
    ticketOrderDetailRef.value.paymentItemList!.push(...result.paymentItemCreatedList)

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
      ticketOrderDetailRef.value.totalMoney < ticketOrderDetailRef.value.paid + money.value
    ) {
      return AlertStore.addError('Số tiền không hợp lệ')
    }
    const response = await TicketOrderApi.sendProductAndPaymentAndClose(
      ticketOrderDetailRef.value.id,
      {
        customerId: ticketOrderDetailRef.value.customerId,
        money: money.value,
        paymentMethodId: paymentMethodId.value,
        reason: note.value,
        ticketProductIdList: (ticketOrderDetailRef.value.ticketProductList || []).map((i) => i.id),
      },
    )
    Object.assign(ticketOrderDetailRef.value, response.ticketModified)
    ticketOrderDetailRef.value.paymentItemList?.push(...response.paymentItemCreatedList)
    ticketOrderDetailRef.value.ticketProductList = TicketProduct.updateListByPartialList(
      ticketOrderDetailRef.value.ticketProductList || [],
      response.ticketProductModifiedAll,
    )
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log(
      '🚀 ~ ModalTicketOrderPayment.vue:116 ~ startSendProductAndPaymentAndClose ~ error:',
      error,
    )
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

    const result = await PaymentApi.customerRefund({
      customerId: ticketOrderDetailRef.value.customerId,
      ticketId: ticketOrderDetailRef.value.id,
      paymentMethodId: paymentMethodId.value,
      money: money.value,
      reason: 'Hoàn tiền',
    })
    Object.assign(ticketOrderDetailRef.value, result.ticketModified)
    ticketOrderDetailRef.value.paymentItemList!.push(result.paymentItemCreated)

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
    const result = await PaymentApi.customerPayment({
      body: {
        customerId: ticketOrderDetailRef.value.customerId,
        paymentMethodId: paymentMethodId.value,
        totalMoney: money.value,
        reason: 'Trả nợ',
        note: '',
        paymentItemData: {
          moneyTopUpAdd: 0,
          payDebt: [
            {
              amount: money.value,
              ticketId: ticketOrderDetailRef.value.id,
            },
          ],
        },
      },
    })
    Object.assign(ticketOrderDetailRef.value, result.ticketModifiedList[0])
    ticketOrderDetailRef.value.paymentItemList!.push(...result.paymentItemCreatedList)

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
              userPermission[PermissionId.PAYMENT_CUSTOMER_REFUND] &&
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
                <span>Tạm ứng lần này</span>
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
                    :validate="
                      ticketOrderDetailRef.status === TicketStatus.Draft ? { gte: 0 } : { gt: 0 }
                    "
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
              userPermission[PermissionId.PAYMENT_CUSTOMER_PAYMENT] &&
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
              userPermission[PermissionId.TICKET_ORDER_SEND_PRODUCT] &&
              userPermission[PermissionId.PAYMENT_CUSTOMER_PAYMENT] &&
              userPermission[PermissionId.TICKET_ORDER_CLOSE] &&
              [TicketStatus.Draft].includes(ticketOrderDetailRef.status)
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
              userPermission[PermissionId.PAYMENT_CUSTOMER_PAYMENT] &&
              [TicketStatus.Debt].includes(ticketOrderDetailRef.status)
            "
          >
            <VueButton type="submit" color="blue" icon="dollar" :loading="paymentLoading">
              <template
                v-if="ticketOrderDetailRef.totalMoney === ticketOrderDetailRef.paid + money"
              >
                Trả nợ và Kết thúc
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
