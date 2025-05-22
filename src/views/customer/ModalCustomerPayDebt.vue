<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import VueButton from '../../common/VueButton.vue'
import { IconClose } from '../../common/icon-antd'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { InputMoney, InputSelect, InputText } from '../../common/vue-form'
import VueModal from '../../common/vue-modal/VueModal.vue'
import { useSettingStore } from '../../modules/_me/setting.store'
import { Customer, CustomerService } from '../../modules/customer'
import { TicketApi, TicketStatus, type Ticket } from '../../modules/ticket'
import { ESTimer } from '../../utils'
import LinkAndStatusTicket from './detail/LinkAndStatusTicket.vue'
import { PaymentMethodService } from '../../modules/payment-method'

const inputMoneyPay = ref<InstanceType<typeof InputMoney>>()

const emit = defineEmits<{
  (e: 'success', value: { customer: Customer }): void
}>()
const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const money = ref(0)
const note = ref('')
const paymentMethodId = ref<number>(0)
const customer = ref<Customer>(Customer.blank())
const ticketPaymentList = ref<{ ticket: Ticket; money: number }[]>([])
const paymentMethodOptions = ref<{ value: any; label: string }[]>([])

const showModal = ref(false)
const dataLoading = ref(false)
const saveLoading = ref(false)

const openModal = async (customerId: number) => {
  showModal.value = true
  if (!isMobile) {
    nextTick(() => inputMoneyPay.value?.focus())
  }
  try {
    dataLoading.value = true
    const fetchPromise = await Promise.all([
      CustomerService.detail(customerId),
      TicketApi.list({
        filter: {
          customerId,
          ticketStatus: TicketStatus.Debt,
        },
        sort: { id: 'ASC' },
      }),
      PaymentMethodService.list({ sort: { priority: 'ASC' } }),
    ])
    customer.value = fetchPromise[0] || Customer.blank()
    ticketPaymentList.value = fetchPromise[1].map((i) => ({ ticket: i, money: 0 }))
    const paymentMethodAll = fetchPromise[2]
    paymentMethodOptions.value = paymentMethodAll.map((i) => ({ value: i.id, label: i.name }))
    paymentMethodId.value = paymentMethodAll[0]?.id || 0
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerPayDebt.vue:52 ~ openModal ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

const closeModal = () => {
  showModal.value = false
  ticketPaymentList.value = []
  money.value = 0
  note.value = ''
  customer.value = Customer.blank()
  paymentMethodId.value = 0
  paymentMethodOptions.value = []
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (money.value === 0) {
      return AlertStore.addError('Số tiền trả nợ phải khác 0')
    }
    const data = await CustomerService.payDebt({
      customerId: customer.value.id,
      paymentMethodId: paymentMethodId.value,
      note: note.value,
      ticketPaymentList: ticketPaymentList.value
        .map((i) => ({ ticketId: i.ticket.id, money: i.money }))
        .filter((i) => i.money > 0),
    })
    AlertStore.addSuccess(`Trả nợ cho KH ${customer.value.fullName} thành công`)
    emit('success', data)
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:83 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleClickPayAllDebt = () => {
  money.value = customer.value.debt
  calculatorEachVoucherPayment()
}

const calculatorEachVoucherPayment = () => {
  let totalMoney = money.value
  ticketPaymentList.value.forEach((item) => {
    const number = Math.min(totalMoney, item.ticket.debt)
    item.money = number
    totalMoney = totalMoney - number
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <form class="bg-white" @submit.prevent="handleSave">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">
          {{ customer.fullName + ': Trả nợ' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <div class="flex flex-wrap justify-between">
          <span>Chọn phiếu trả nợ (tự động)</span>
          <span>
            Tổng nợ
            <strong>{{ formatMoney(customer.debt) }}</strong>
          </span>
        </div>
        <div class="mt-2 table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Phiếu</th>
                <th>Nợ</th>
                <th>Số tiền trả</th>
              </tr>
            </thead>
            <tbody v-if="dataLoading">
              <tr>
                <td colspan="100">
                  <div class="vue-skeleton-loading"></div>
                  <div class="vue-skeleton-loading mt-2"></div>
                </td>
              </tr>
              <tr>
                <td colspan="100">
                  <div class="vue-skeleton-loading"></div>
                  <div class="vue-skeleton-loading mt-2"></div>
                </td>
              </tr>
            </tbody>
            <tbody>
              <tr v-for="(ticketPayment, index) in ticketPaymentList" :key="index">
                <td>
                  <LinkAndStatusTicket :ticket="ticketPayment.ticket" />
                  <div>
                    {{ ESTimer.timeToText(ticketPayment.ticket.startedAt, 'DD/MM/YYYY hh:mm') }}
                  </div>
                </td>
                <td class="text-right">
                  {{ formatMoney(ticketPayment.ticket.debt) }}
                </td>
                <td class="text-right">
                  {{ formatMoney(ticketPayment.money) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex flex-wrap gap-4 mt-4">
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
                  <VueButton color="blue" @click="handleClickPayAllDebt">Tất cả</VueButton>
                  <InputMoney
                    ref="inputMoneyPay"
                    v-model:value="money"
                    textAlign="right"
                    :validate="{ lte: customer.debt, gt: 0 }"
                    required
                    @update:value="calculatorEachVoucherPayment"
                  />
                </div>
              </div>
            </div>
            <div class="mt-4">
              <div>Số nợ còn lại</div>
              <div>
                <InputMoney :value="customer.debt - money" disabled textAlign="right" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4">
        <div class="flex justify-center gap-4">
          <VueButton type="reset" icon="close" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton type="submit" color="blue" :loading="saveLoading" icon="save">
            Xác nhận trả nợ
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>
