<script setup lang="ts">
import { onMounted, ref } from 'vue'
import VueButton from '../../common/VueButton.vue'
import { IconClose, IconFileSearch } from '../../common/icon-antd'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { InputMoney, InputOptions, InputSelect, InputText } from '../../common/vue-form'
import type { ItemOption } from '../../common/vue-form/InputOptions.vue'
import VueModal from '../../common/vue-modal/VueModal.vue'
import { MeService } from '../../modules/_me/me.service'
import { useSettingStore } from '../../modules/_me/setting.store'
import { Customer, CustomerService } from '../../modules/customer'
import { PaymentMethodService } from '../../modules/payment-method'
import { PermissionId } from '../../modules/permission/permission.enum'
import { TicketApi, TicketStatus, type Ticket } from '../../modules/ticket'
import { ESString, ESTimer } from '../../utils'
import ModalCustomerDetail from '../customer/detail/ModalCustomerDetail.vue'
import ModalCustomerUpsert from '../customer/upsert/ModalCustomerUpsert.vue'
import LinkAndStatusTicket from '../ticket-base/LinkAndStatusTicket.vue'

const inputMoneyPay = ref<InstanceType<typeof InputMoney>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalCustomerUpsert = ref<InstanceType<typeof ModalCustomerUpsert>>()

const emit = defineEmits<{
  (e: 'success', value: { customer: Customer }): void
}>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission, user } = MeService

const customerOptions = ref<ItemOption[]>([])
const customer = ref<Customer>(Customer.blank())

const money = ref(0)
const note = ref('')
const paymentMethodId = ref<number>(0)
const ticketPaymentList = ref<{ ticket: Ticket; money: number }[]>([])
const paymentMethodOptions = ref<{ value: any; label: string }[]>([])

const showModal = ref(false)
const ticketLoading = ref(false)
const saveLoading = ref(false)

onMounted(async () => {
  const paymentMethodAll = await PaymentMethodService.list({ sort: { priority: 'ASC' } })
  paymentMethodOptions.value = paymentMethodAll.map((i) => ({ value: i.id, label: i.name }))
  paymentMethodId.value = paymentMethodAll[0]?.id || 0

  await CustomerService.refreshDB()
})

const searchingCustomer = async (text: string) => {
  customer.value = Customer.blank()
  if (text) {
    const customerList = await CustomerService.search(text)
    customerOptions.value = customerList.map((i) => {
      return { text: i.fullName, value: i.id, data: i }
    })
  } else {
    customerOptions.value = []
  }
}

const selectCustomer = async (data?: Customer) => {
  customer.value = data ? Customer.from(data) : Customer.blank()
  if (customer.value.debt > 0) {
    try {
      ticketLoading.value = true
      const ticketDebtList = await TicketApi.list({
        filter: {
          customerId: customer.value.id,
          status: TicketStatus.Debt,
        },
        sort: { id: 'ASC' },
      })
      ticketPaymentList.value = ticketDebtList.map((i) => ({ ticket: i, money: 0 }))
    } catch (error) {
      console.log('🚀 ~ ModalPaymentMoneyIn.vue:82 ~ selectCustomer ~ error:', error)
    } finally {
      ticketLoading.value = false
    }
  } else {
    ticketPaymentList.value = []
  }
}

const openModal = async () => {
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  ticketPaymentList.value = []
  money.value = 0
  note.value = ''
  customer.value = Customer.blank()
  paymentMethodId.value = 0
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (money.value === 0) {
      return AlertStore.addError('Số tiền trả nợ phải khác 0')
    }
    const data = await CustomerService.customerPayment({
      customerId: customer.value.id,
      paymentMethodId: paymentMethodId.value,
      note: note.value,
      cashierId: user.value?.id || 0,
      money: money.value,
      ticketPaymentList: ticketPaymentList.value
        .map((i) => ({ ticketId: i.ticket.id, money: i.money }))
        .filter((i) => i.money > 0),
    })
    AlertStore.addSuccess(`KH ${customer.value.fullName} thanh toán thành công`)
    emit('success', data)
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalPaymentMoneyIn.vue:126 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleClickPayAllDebt = () => {
  money.value = Math.max(customer.value.debt, 0)
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
  <VueModal v-model:show="showModal" style="margin-top: 50px">
    <div class="pl-4 py-3 flex items-center bg-white" style="border-bottom: 1px solid #dedede">
      <div class="flex-1 font-medium" style="font-size: 16px">Tạo phiếu thu</div>
      <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
        <IconClose />
      </div>
    </div>
    <form class="bg-white p-4" @submit.prevent="handleSave">
      <div>
        <div class="flex gap-1 flex-wrap">
          <span>Tên khách hàng</span>
          <template v-if="customer.id">
            <a @click="modalCustomerDetail?.openModal(customer.id)">
              <IconFileSearch />
            </a>
            <span v-if="customer.debt > 0">
              (Nợ cũ:
              <b style="color: var(--text-red)">{{ formatMoney(customer.debt) }}</b>
              )
            </span>
            <span v-if="customer.debt < 0">
              (Quỹ:
              <b style="color: var(--text-green)">{{ formatMoney(-customer.debt) }}</b>
              )
            </span>
            <a
              v-if="userPermission[PermissionId.CUSTOMER_UPDATE]"
              @click="modalCustomerUpsert?.openModal(customer)"
            >
              Sửa thông tin KH
            </a>
          </template>
          <div style="margin-left: auto">
            <a
              v-if="!customer.id && userPermission[PermissionId.CUSTOMER_CREATE]"
              @click="modalCustomerUpsert?.openModal()"
            >
              Thêm KH mới
            </a>
          </div>
        </div>

        <div style="height: 40px">
          <InputOptions
            ref="inputOptionsCustomer"
            :options="customerOptions"
            :maxHeight="320"
            placeholder="(F4) Tìm kiếm bằng Tên hoặc Số Điện Thoại"
            required
            @selectItem="({ data }) => selectCustomer(data)"
            @update:text="searchingCustomer"
          >
            <template #option="{ item: { data } }">
              <div>
                <b>{{ data.fullName }}</b>
                - {{ ESString.formatPhone(data.phone) }} -
                {{ ESTimer.timeToText(data.birthday, 'DD/MM/YYYY') }}
                <span v-if="data.debt > 0">
                  Nợ:
                  <strong style="color: var(--text-red)">{{ formatMoney(data.debt) }}</strong>
                </span>
                <span v-if="data.debt < 0">
                  Quỹ:
                  <strong style="color: var(--text-green)">{{ formatMoney(-data.debt) }}</strong>
                </span>
              </div>
              <div>{{ ESString.formatAddress(data) }}</div>
            </template>
          </InputOptions>
        </div>
      </div>

      <div v-if="customer.debt > 0" class="mt-4">
        <div class="flex flex-wrap justify-between">
          <span>Chọn phiếu trả nợ (tự động)</span>
          <span>
            Tổng nợ
            <strong>{{ formatMoney(customer.debt) }}</strong>
          </span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Phiếu</th>
                <th>Nợ</th>
                <th>Số tiền trả</th>
              </tr>
            </thead>
            <tbody v-if="ticketLoading">
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
                  :validate="{ gt: 0 }"
                  required
                  @update:value="calculatorEachVoucherPayment"
                />
              </div>
            </div>
          </div>
          <div v-if="customer.debt - money >= 0" class="mt-4">
            <div>Số nợ còn lại</div>
            <div>
              <InputMoney :value="customer.debt - money" disabled textAlign="right" />
            </div>
          </div>
          <div v-else class="mt-4">
            <div>Số dư quỹ</div>
            <div>
              <InputMoney :value="money - customer.debt" disabled textAlign="right" />
            </div>
          </div>
        </div>
      </div>

      <div class="p-4">
        <div class="flex justify-center gap-4">
          <VueButton type="reset" icon="close" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton type="submit" color="blue" :loading="saveLoading" icon="save">
            Xác nhận thanh toán
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <ModalCustomerUpsert ref="modalCustomerUpsert" />
</template>
