<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose } from '../../../../common/icon-antd'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputMoney, InputNumber, InputSelect, InputText } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { MeService } from '../../../../modules/_me/me.service'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { PaymentViewType } from '../../../../modules/enum'
import { PaymentMethodService, type PaymentMethod } from '../../../../modules/payment-method'
import { PaymentApi } from '../../../../modules/payment/payment.api'
import { VoucherType } from '../../../../modules/payment/payment.model'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { Ticket, TicketMoneyApi, TicketStatus } from '../../../../modules/ticket'
import { ESArray } from '../../../../utils'
import TicketPaymentList from '../../../ticket-base/TicketPaymentList.vue'

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
const paymentMethodId = ref<number>(0)
const note = ref('')
const paymentMethodOptions = ref<{ value: any; label: string }[]>([])
const paymentMethodMap = ref<Record<string, PaymentMethod>>({})

onMounted(async () => {
  const paymentMethodAll = await PaymentMethodService.list({ sort: { priority: 'ASC' } })
  paymentMethodMap.value = ESArray.arrayToKeyValue(paymentMethodAll, 'id')
  paymentMethodOptions.value = paymentMethodAll.map((i) => ({ value: i.id, label: i.name }))
  paymentMethodId.value = paymentMethodAll[0]?.id || 0
})

const openModal = async (options: { ticket: Ticket; paymentView: PaymentViewType }) => {
  paymentView.value = options.paymentView
  money.value = 0
  showModal.value = true

  try {
    ticketClone.value = Ticket.from(options.ticket)

    ticketClone.value.paymentList = await PaymentApi.list({
      filter: {
        voucherId: ticketClone.value.id,
        voucherType: VoucherType.Ticket,
      },
      sort: { id: 'ASC' },
    })

    if (!isMobile) {
      nextTick(() => inputMoneyPayment.value?.focus())
    }
  } catch (error) {
    console.log('🚀 ~ ModalTicketClinicPayment.vue:67 ~ openModal ~ error:', error)
  }
}

const closeModal = () => {
  showModal.value = false
  money.value = 0
  note.value = ''
  paymentMethodId.value = 0
}

const startPrepayment = async () => {
  paymentLoading.value = true
  try {
    await TicketMoneyApi.prepayment({
      ticketId: ticketClone.value.id,
      money: money.value,
      paymentMethodId: paymentMethodId.value,
      note: note.value,
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
  if (ticketClone.value.paid < money.value) {
    return AlertStore.addError('Số tiền hoàn trả không hợp lệ')
  }
  paymentLoading.value = true
  try {
    await TicketMoneyApi.refundOverpaid({
      ticketId: ticketClone.value.id,
      money: money.value,
      paymentMethodId: paymentMethodId.value,
      note: note.value,
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
    await TicketMoneyApi.payDebt({
      ticketId: ticketClone.value.id,
      money: money.value,
      paymentMethodId: paymentMethodId.value,
      note: note.value,
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
        <TicketPaymentList :ticket="ticketClone" :payment-method-map="paymentMethodMap" />
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
                    @click="money = ticketClone.debt > 0 ? ticketClone.debt : 0"
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
              <div v-if="ticketClone.totalMoney >= ticketClone.paid + money">Còn thiếu</div>
              <div v-else>Còn thừa</div>
              <div>
                <InputMoney
                  :value="Math.abs(ticketClone.totalMoney - (ticketClone.paid + money))"
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
              (userPermission[PermissionId.TICKET_CLINIC_PAYMENT] ||
                userPermission[PermissionId.RECEPTION_PAYMENT]) &&
              [TicketStatus.Draft, TicketStatus.Deposited, TicketStatus.Executing].includes(
                ticketClone.status,
              )
            "
          >
            <VueButton type="submit" color="blue" icon="dollar" :loading="paymentLoading">
              Tạm ứng
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
                    @click="money = ticketClone.paid - ticketClone.totalMoney"
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
              <div>Còn thừa</div>
              <div>
                <InputMoney
                  :value="ticketClone.paid - money - ticketClone.totalMoney"
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
              (userPermission[PermissionId.TICKET_CLINIC_REFUND_OVERPAID] ||
                userPermission[PermissionId.RECEPTION_REFUND_OVER_PAID]) &&
              [TicketStatus.Deposited, TicketStatus.Executing].includes(ticketClone.status)
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
                  <VueButton color="default" type="button" @click="money = ticketClone.debt">
                    Tất cả
                  </VueButton>
                  <InputMoney
                    ref="inputMoneyPayment"
                    v-model:value="money"
                    text-align="right"
                    :validate="{ gt: 0, lte: ticketClone.debt }"
                  />
                </div>
              </div>
            </div>
            <div class="mt-4">
              <div>Nợ còn</div>
              <div>
                <InputMoney :value="ticketClone.debt - money" disabled textAlign="right" />
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
              (userPermission[PermissionId.RECEPTION_PAYMENT] ||
                userPermission[PermissionId.TICKET_CLINIC_PAYMENT]) &&
              [TicketStatus.Debt].includes(ticketClone.status)
            "
          >
            <VueButton type="submit" color="blue" icon="dollar" :loading="paymentLoading">
              <template v-if="ticketClone.debt === money">Trả nợ và Hoàn thành</template>
              <template v-if="ticketClone.debt != money">Trả nợ</template>
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
