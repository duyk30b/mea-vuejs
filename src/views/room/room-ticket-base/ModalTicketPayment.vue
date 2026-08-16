<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputMoney, InputNumber, InputSelect, InputText } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { PaymentViewType } from '@/modules/enum'
import { WalletService } from '@/modules/wallet'
import { PaymentApi } from '@/modules/payment/payment.api'
import { PermissionId } from '@/modules/permission/permission.enum'
import { Ticket, TicketMoneyApi } from '@/modules/ticket'
import TicketPaymentList from '@/views/room/room-ticket-base/TicketPaymentList.vue'
import { onMounted, ref } from 'vue'
import { TicketActionType, TicketStatus } from '@/modules/ticket/ticket.type'
import { PaymentActionType } from '@/modules/payment/payment.type'
import { PaymentTicketApi } from '@/modules/payment_ticket/payment_ticket.api'

const inputMoneyPayment = ref<InstanceType<typeof InputNumber>>()

const emit = defineEmits<{ (e: 'success'): void }>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

const showModal = ref(false)
const paymentLoading = ref(false)
const paymentView = ref(PaymentViewType.Success)
const ticketClone = ref(Ticket.blank())

const money = ref(0)
const walletId = ref<string>('')
const note = ref('')
const walletOptions = ref<{ value: any; label: string }[]>([])

onMounted(async () => {
  const walletAll = await WalletService.list({ sort: { code: 'ASC' } })
  walletOptions.value = walletAll.map((i) => ({ value: i.id, label: i.name }))
  walletId.value = walletAll[0]?.id || ''
})

const openModal = async (options: { ticket: Ticket; paymentView: PaymentViewType }) => {
  paymentView.value = options.paymentView
  money.value = 0
  showModal.value = true

  try {
    ticketClone.value = Ticket.from(options.ticket)

    ticketClone.value.paymentTicketList = await PaymentTicketApi.list({
      filter: {
        ticketId: ticketClone.value.id,
      },
      relation: {
        payment: true,
      },
      sort: { id: 'ASC' },
    })
  } catch (error) {
    console.log('🚀 ~ ModalTicketClinicPayment.vue:67 ~ openModal ~ error:', error)
  }
}

const closeModal = () => {
  showModal.value = false
  money.value = 0
  note.value = ''
  walletId.value = ''
}

const startPrepayment = async () => {
  paymentLoading.value = true
  try {
    const result = await TicketMoneyApi.paymentMoney({
      ticketId: ticketClone.value.id,
      body: {
        paymentActionType: PaymentActionType.PaymentMoney,
        ticketActionType: TicketActionType.PrePayment,
        walletId: walletId.value,
        isPaymentEachItem: 0,
        paidTotal: money.value,
        note: '',
      },
    })
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalVisitPayment.vue:54 ~ startPrepayment ~ error:', error)
  } finally {
    paymentLoading.value = false
  }
}

const startRefundOverpaid = async () => {
  if (ticketClone.value.paidTotal < money.value) {
    return AlertStore.addError('Số tiền hoàn trả không hợp lệ')
  }
  paymentLoading.value = true
  try {
    const result = await TicketMoneyApi.paymentMoney({
      ticketId: ticketClone.value.id,
      body: {
        paymentActionType: PaymentActionType.RefundMoney,
        ticketActionType: TicketActionType.RefundMoney,
        walletId: walletId.value,
        isPaymentEachItem: 0,
        paidTotal: -money.value,
        note: '',
      },
    })
    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalVisitPayment.vue:67 ~ startRefundOverpaid ~ error:', error)
  } finally {
    paymentLoading.value = false
  }
}

const startPayDebt = async () => {
  paymentLoading.value = true
  try {
    const result = await TicketMoneyApi.changeDebt({
      customerId: ticketClone.value.customerId,
      paymentActionType: PaymentActionType.PayDebt,
      walletId: walletId.value,
      note: '',
      changeDebtListBody: [
        {
          ticketActionType: TicketActionType.PayDebt,
          ticketId: ticketClone.value.id,
          paid: money.value,
          debt: -money.value,
        },
      ],
    })
    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalVisitPayment.vue:80 ~ startPayDebt ~ error:', error)
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
        <div class="flex-1 text-lg font-medium">
          Thông tin thanh toán: {{ ticketClone.customer?.fullName }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <TicketPaymentList :ticket="ticketClone" />
      </div>

      <!-- Prepayment -->
      <form
        class="p-4"
        v-if="paymentView === PaymentViewType.Prepayment"
        @submit.prevent="startPrepayment"
      >
        <div class="flex flex-wrap gap-4">
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <div>
              <div>Phương thức thanh toán</div>
              <div>
                <InputSelect v-model:value="walletId" :options="walletOptions" />
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
                      money =
                        ticketClone.totalMoney > ticketClone.paidTotal
                          ? ticketClone.totalMoney - ticketClone.paidTotal
                          : 0
                    "
                  >
                    Tất cả
                  </VueButton>
                  <InputMoney
                    ref="inputMoneyPayment"
                    v-model:value="money"
                    :validate="{ gt: 0 }"
                    text-align="right"
                  />
                </div>
              </div>
            </div>
            <div class="mt-4">
              <div v-if="ticketClone.totalMoney >= ticketClone.paidTotal + money">Còn thiếu</div>
              <div v-else>Còn thừa</div>
              <div>
                <InputMoney
                  :value="Math.abs(ticketClone.totalMoney - (ticketClone.paidTotal + money))"
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
              [TicketStatus.Draft, TicketStatus.Schedule, TicketStatus.Executing].includes(
                ticketClone.status,
              )
            "
          >
            <VueButton type="submit" color="blue" icon="dollar" :loading="paymentLoading">
              Thanh toán
            </VueButton>
          </div>
        </div>
      </form>

      <!-- Refund overpaid -->
      <form
        class="p-4"
        v-else-if="paymentView === PaymentViewType.RefundOverpaid"
        @submit.prevent="startRefundOverpaid"
      >
        <div class="flex flex-wrap gap-4">
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <div>
              <div>Phương thức hoàn trả</div>
              <div>
                <InputSelect v-model:value="walletId" :options="walletOptions" />
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
                      money =
                        ticketClone.paidTotal > ticketClone.totalMoney
                          ? ticketClone.paidTotal - ticketClone.totalMoney
                          : ticketClone.paidTotal
                    "
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
              <div v-if="ticketClone.totalMoney >= ticketClone.paidTotal - money">Còn thiếu</div>
              <div v-else>Còn thừa</div>
              <div>
                <InputMoney
                  :value="Math.abs(ticketClone.totalMoney - (ticketClone.paidTotal - money))"
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
              [TicketStatus.Executing].includes(ticketClone.status)
            "
          >
            <VueButton type="submit" color="blue" icon="dollar" :loading="paymentLoading">
              <span>Hoàn trả tiền</span>
            </VueButton>
          </div>
        </div>
      </form>

      <!-- PayDebt -->
      <form
        class="p-4"
        v-else-if="paymentView === PaymentViewType.PayDebt"
        @submit.prevent="startPayDebt"
      >
        <div class="flex flex-wrap gap-4">
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <div>
              <div>Phương thức thanh toán</div>
              <div>
                <InputSelect v-model:value="walletId" :options="walletOptions" />
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
                  <VueButton color="default" type="button" @click="money = ticketClone.debtTotal">
                    Tất cả
                  </VueButton>
                  <InputMoney
                    ref="inputMoneyPayment"
                    v-model:value="money"
                    text-align="right"
                    :validate="{ gt: 0, lte: ticketClone.debtTotal }"
                  />
                </div>
              </div>
            </div>
            <div class="mt-4">
              <div>Nợ còn</div>
              <div>
                <InputMoney :value="ticketClone.debtTotal - money" disabled textAlign="right" />
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
              [TicketStatus.Debt].includes(ticketClone.status)
            "
          >
            <VueButton type="submit" color="blue" icon="dollar" :loading="paymentLoading">
              <template v-if="ticketClone.debtTotal === money">Trả nợ và Hoàn thành</template>
              <template v-if="ticketClone.debtTotal != money">Trả nợ</template>
            </VueButton>
          </div>
        </div>
      </form>

      <div v-else class="pb-4 pt-8 flex justify-center gap-4">
        <VueButton type="reset" class="btn" @click="closeModal" icon="close">Đóng lại</VueButton>
      </div>
    </div>
  </VueModal>
</template>
