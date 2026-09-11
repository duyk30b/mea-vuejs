<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputMoney, InputText } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import type { Payment } from '@/modules/payment/payment.model'
import { PaymentActionType } from '@/modules/payment/payment.type'
import { PaymentTicketApi } from '@/modules/payment_ticket/payment_ticket.api'
import { PaymentTicketService } from '@/modules/payment_ticket/payment_ticket.service'
import { Ticket, TicketMoneyApi } from '@/modules/ticket'
import { TicketActionType, TicketStatus } from '@/modules/ticket/ticket.type'
import InputSelectWallet from '@/views/component/InputSelectWallet.vue'
import { nextTick, ref } from 'vue'
import TableTicketPaidHistory from './TableTicketPaidHistory.vue'

const tableTicketPaidHistory = ref<InstanceType<typeof TableTicketPaidHistory>>()

const emit = defineEmits<{ (e: 'success'): void }>()

const showModal = ref(false)
const paymentLoading = ref(false)
const ticketClone = ref(Ticket.blank())
const paymentList = ref<Payment[]>([])

const money = ref(0)
const walletId = ref<string>('')
const note = ref('')

const openModal = async (options: { ticket: Ticket }) => {
  money.value = 0
  showModal.value = true

  ticketClone.value = Ticket.from(options.ticket)

  nextTick(async () => {
    await tableTicketPaidHistory.value?.startFetchData()
  })
}

const closeModal = () => {
  showModal.value = false
  money.value = 0
  note.value = ''
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
  } catch (error: any) {
    console.log('🚀 ~ file: ModalTicketPayDebt.vue:90 ~ startPayDebt ~ error:', error)
    AlertStore.addError(error.message)
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
          Thông tin trả nợ: {{ ticketClone.customer?.fullName }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <TableTicketPaidHistory ref="tableTicketPaidHistory" :ticket="ticketClone" />
      </div>

      <!-- PayDebt -->
      <form class="p-4" @submit.prevent="startPayDebt">
        <div class="flex flex-wrap gap-4">
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <div>
              <div>Phương thức thanh toán</div>
              <div>
                <InputSelectWallet v-model:walletId="walletId" autoSelectFirstValue />
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
                <span>Số tiền trả nợ</span>
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
          <div>
            <VueButton type="submit" color="blue" icon="dollar" :loading="paymentLoading">
              <template
                v-if="ticketClone.status === TicketStatus.Debt && ticketClone.debtTotal === money"
              >
                Trả nợ và Hoàn thành
              </template>
              <template v-else>Trả nợ</template>
            </VueButton>
          </div>
        </div>
      </form>
    </div>
  </VueModal>
</template>
