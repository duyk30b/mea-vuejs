<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputMoney, InputSelect, InputText } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Customer, CustomerService } from '@/modules/customer'
import { PaymentApi } from '@/modules/payment'
import { WalletService } from '@/modules/wallet'
import { TicketMoneyApi, TicketQueryApi, TicketStatus, type Ticket } from '@/modules/ticket'
import { ESTimer } from '@/utils'
import LinkAndStatusTicket from '@/views/room/room-ticket-base/LinkAndStatusTicket.vue'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const inputMoneyPay = ref<InstanceType<typeof InputMoney>>()

const emit = defineEmits<{
  (e: 'success', value: { customer: Customer }): void
}>()
const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission, user } = MeService

const totalMoney = ref(0)
const note = ref('')
const customer = ref<Customer>(Customer.blank())
const walletId = ref<string>('')
const walletOptions = ref<{ value: any; label: string }[]>([])

const ticketPaymentList = ref<{ ticket: Ticket; money: number; moneyItem: number }[]>([])

const showModal = ref(false)
const dataLoading = ref(false)
const saveLoading = ref(false)

onMounted(async () => {
  const walletAll = await WalletService.list({ sort: { code: 'ASC' } })
  walletOptions.value = walletAll.map((i) => ({ value: i.id, label: i.name }))
  walletId.value = walletAll[0]?.id || ''
})

const openModal = async (customerId: number) => {
  showModal.value = true
  totalMoney.value = 0
  note.value = ''
  try {
    dataLoading.value = true
    const fetchPromise = await Promise.all([
      CustomerService.detail(customerId),
      TicketQueryApi.list({
        filter: {
          customerId,
          status: TicketStatus.Debt,
        },
        sort: { id: 'ASC' },
      }),
      WalletService.list({ sort: { code: 'ASC' } }),
    ])
    customer.value = fetchPromise[0] || Customer.blank()
    ticketPaymentList.value = fetchPromise[1].ticketList.map((i) => ({
      ticket: i,
      money: 0,
      moneyItem: 0,
    }))
  } catch (error) {
    console.log('🚀 ~ ModalCustomerPayDebt.vue:70 ~ openModal ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

const closeModal = () => {
  showModal.value = false
  ticketPaymentList.value = []
  totalMoney.value = 0
  note.value = ''
  customer.value = Customer.blank()
  walletId.value = ''
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (totalMoney.value === 0) {
      return AlertStore.addError('Số tiền trả nợ phải khác 0')
    }

    const data = await TicketMoneyApi.payDebt({
      customerId: customer.value.id,
      walletId: walletId.value,
      totalMoney: totalMoney.value,
      note: '',
      dataList: ticketPaymentList.value
        .map((i) => ({ ticketId: i.ticket.id, debtMinus: i.money, debtItemMinus: i.moneyItem }))
        .filter((i) => i.debtMinus + i.debtItemMinus > 0),
    })
    AlertStore.addSuccess(`Trả nợ cho KH ${customer.value.fullName} thành công`)
    emit('success', { customer: data.customerModified })
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalCustomerPayDebt.vue:105 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleClickPayAllDebt = () => {
  totalMoney.value = customer.value.debt
  calculatorEachVoucherPayment()
}

const calculatorEachVoucherPayment = () => {
  let totalMoneyRemain = totalMoney.value
  ticketPaymentList.value.forEach((item) => {
    const number = Math.min(totalMoneyRemain, item.ticket.debt)
    item.money = number
    totalMoneyRemain = totalMoneyRemain - number

    const numberItem = Math.min(totalMoneyRemain, item.ticket.debtItem)
    item.moneyItem = numberItem
    totalMoneyRemain = totalMoneyRemain - numberItem
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" @close="closeModal">
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
                    {{ ESTimer.timeToText(ticketPayment.ticket.createdAt, 'DD/MM/YYYY hh:mm') }}
                  </div>
                </td>
                <td class="text-right">
                  {{ formatMoney(ticketPayment.ticket.debtAmount) }}
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
                  <VueButton color="blue" @click="handleClickPayAllDebt">Tất cả</VueButton>
                  <InputMoney
                    ref="inputMoneyPay"
                    v-model:value="totalMoney"
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
                <InputMoney :value="customer.debt - totalMoney" disabled textAlign="right" />
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
