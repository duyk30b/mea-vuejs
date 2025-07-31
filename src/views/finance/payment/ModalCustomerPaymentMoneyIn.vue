<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose, IconFileSearch } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputMoney, InputOptions, InputSelect, InputText } from '@/common/vue-form'
import type { ItemOption } from '@/common/vue-form/InputOptions.vue'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Customer, CustomerService } from '@/modules/customer'
import { PaymentMethodService } from '@/modules/payment-method'
import { PermissionId } from '@/modules/permission/permission.enum'
import { Ticket, TicketQueryApi, TicketStatus } from '@/modules/ticket'
import { ESString, ESTimer } from '@/utils'
import ModalCustomerDetail from '@/views/customer/detail/ModalCustomerDetail.vue'
import ModalCustomerUpsert from '@/views/customer/upsert/ModalCustomerUpsert.vue'
import LinkAndStatusTicket from '@/views/ticket-base/LinkAndStatusTicket.vue'
import { onMounted, ref } from 'vue'

const inputMoneyPay = ref<InstanceType<typeof InputMoney>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalCustomerUpsert = ref<InstanceType<typeof ModalCustomerUpsert>>()

const emit = defineEmits<{
  (e: 'success', value: { customer: Customer }): void
}>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission, user, organization } = MeService

const customerOptions = ref<ItemOption[]>([])
const customer = ref<Customer>(Customer.blank())

const totalMoney = ref(0)
const reason = ref('')
const paymentMethodId = ref<number>(0)
const paymentMethodOptions = ref<{ value: any; label: string }[]>([])

const payDebtTicketList = ref<{ ticket: Ticket; money: number }[]>([])
const prepaymentTicketList = ref<{ ticket: Ticket; money: number }[]>([])
const prepaymentTicket = ref<{ ticket: Ticket; money: number }>()
const moneyTopUp = ref(0)

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
  try {
    ticketLoading.value = true
    const { ticketList: ticketActionList } = await TicketQueryApi.list({
      filter: {
        customerId: customer.value.id,
        status: {
          IN: [
            TicketStatus.Debt,
            TicketStatus.Draft,
            TicketStatus.Schedule,
            TicketStatus.Deposited,
            TicketStatus.Executing,
          ],
        },
      },
      sort: { id: 'ASC' },
    })
    payDebtTicketList.value = ticketActionList
      .filter((i) => i.status === TicketStatus.Debt)
      .map((i) => ({
        ticket: i,
        money: 0,
      }))
    prepaymentTicketList.value = ticketActionList
      .filter((i) =>
        [
          TicketStatus.Draft,
          TicketStatus.Schedule,
          TicketStatus.Deposited,
          TicketStatus.Executing,
        ].includes(i.status),
      )
      .map((i) => ({
        ticket: i,
        money: 0,
      }))
    prepaymentTicket.value = prepaymentTicketList.value[0]
  } catch (error) {
    console.log('🚀 ~ ModalPaymentMoneyIn.vue:82 ~ selectCustomer ~ error:', error)
  } finally {
    ticketLoading.value = false
  }
}

const openModal = async () => {
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  payDebtTicketList.value = []
  prepaymentTicketList.value = []
  prepaymentTicket.value = undefined
  totalMoney.value = 0
  moneyTopUp.value = 0
  reason.value = ''
  customer.value = Customer.blank()
  paymentMethodId.value = 0
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (totalMoney.value === 0) {
      return AlertStore.addError('Số tiền trả nợ phải khác 0')
    }

    // const data = await PaymentApi.customerPayment({
    //   body: {
    //     customerId: customer.value.id,
    //     paymentMethodId: paymentMethodId.value,
    //     reason: reason.value,
    //     totalMoney: totalMoney.value,
    //     note: '',
    //     paymentItemData: {
    //       moneyTopUpAdd: moneyTopUp.value,
    //       payDebt: payDebtTicketList.value
    //         .map((i) => ({ ticketId: i.ticket.id, paidAmount: i.money }))
    //         .filter((i) => i.paidAmount > 0),
    //       prepayment: prepaymentTicket.value
    //         ? {
    //             ticketId: prepaymentTicket.value.ticket.id,
    //             itemList: [
    //               {
    //                 paidAmount: prepaymentTicket.value.money,
    //                 expectedPrice: prepaymentTicket.value.money,
    //                 actualPrice: prepaymentTicket.value.money,
    //                 quantity: 1,
    //                 discountMoney: 0,
    //                 discountPercent: 0,
    //                 ticketItemId: 0,
    //                 paymentInteractId: 0,
    //                 voucherItemType: PaymentVoucherItemType.Other,
    //               },
    //             ],
    //           }
    //         : undefined,
    //     },
    //   },
    // })
    AlertStore.addSuccess(`KH ${customer.value.fullName} thanh toán thành công`)
    // emit('success', { customer: data.customerModified })
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalPaymentMoneyIn.vue:126 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleClickPayAll = () => {
  const totalDebt = payDebtTicketList.value.reduce((acc, item) => {
    return acc + item.ticket.debt
  }, 0)
  const totalPrepayment = prepaymentTicketList.value.reduce((acc, item) => {
    return acc + item.ticket.debt
  }, 0)
  totalMoney.value = totalDebt + totalPrepayment
  calculatorEachVoucherPayment()
}

const calculatorEachVoucherPayment = () => {
  let moneyRemain = totalMoney.value
  payDebtTicketList.value.forEach((item) => {
    if (item.ticket.paid < item.ticket.totalMoney) {
      const number = Math.min(moneyRemain, item.ticket.debt)
      item.money = number
      moneyRemain = moneyRemain - number
    }
  })
  if (moneyRemain > 0 && prepaymentTicket.value) {
    prepaymentTicket.value.money = moneyRemain
    moneyRemain = moneyRemain - moneyRemain
  }
  moneyTopUp.value = moneyRemain
}

const startPrintPayment = async () => {
  // const tempPayment = Payment.blank()
  // tempPayment.money = totalMoney.value
  // tempPayment.cashierId = MeService.user.value?.id || 0
  // tempPayment.cashier = MeService.user.value!
  // tempPayment.createdAt = Date.now()
  // tempPayment.reason = reason.value
  // tempPayment.moneyDirection = MoneyDirection.In

  // await PrintHtmlAction.startPrintCustomerPayment({
  //   customer: customer.value,
  //   payment: tempPayment,
  // })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 50px" @close="closeModal">
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

      <div class="mt-4">
        <div class="flex flex-wrap justify-between">
          <span>Chọn phiếu thanh toán</span>
          <span v-if="customer.debt > 0"></span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th v-if="CONFIG.MODE === 'development'">ID</th>
                <th>Phiếu</th>
                <th>Hiện tại</th>
                <th>Dự kiến</th>
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
              <tr v-for="(ticketPayment, index) in payDebtTicketList" :key="index">
                <td v-if="CONFIG.MODE === 'development'" style="color: violet">
                  {{ ticketPayment.ticket.id }}
                </td>
                <td>
                  <LinkAndStatusTicket :ticket="ticketPayment.ticket" />
                  <div>
                    {{ ESTimer.timeToText(ticketPayment.ticket.startedAt, 'DD/MM/YYYY hh:mm') }}
                  </div>
                </td>
                <td class="text-right">
                  {{ formatMoney(ticketPayment.ticket.paid) }}/
                  {{ formatMoney(ticketPayment.ticket.totalMoney) }}
                </td>
                <td class="text-right">
                  {{ formatMoney(ticketPayment.money) }}
                </td>
              </tr>
              <tr v-for="(ticketPayment, index) in prepaymentTicketList" :key="index">
                <td v-if="CONFIG.MODE === 'development'" style="color: violet">
                  {{ ticketPayment.ticket.id }}
                </td>
                <td>
                  <LinkAndStatusTicket :ticket="ticketPayment.ticket" />
                  <div>
                    {{ ESTimer.timeToText(ticketPayment.ticket.startedAt, 'DD/MM/YYYY hh:mm') }}
                  </div>
                </td>
                <td class="text-right">
                  {{ formatMoney(ticketPayment.ticket.paid) }}/
                  {{ formatMoney(ticketPayment.ticket.totalMoney) }}
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
            <div>Lý do</div>
            <div>
              <InputText v-model:value="reason" />
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
                <VueButton color="blue" @click="handleClickPayAll">Tất cả</VueButton>
                <InputMoney
                  ref="inputMoneyPay"
                  v-model:value="totalMoney"
                  textAlign="right"
                  :validate="{ gt: 0 }"
                  required
                  :disabled="!customer.id"
                  @update:value="calculatorEachVoucherPayment"
                />
              </div>
            </div>
          </div>
          <div v-if="customer.debt >= totalMoney" class="mt-4">
            <div>Số nợ còn lại</div>
            <div>
              <InputMoney :value="customer.debt - totalMoney" disabled textAlign="right" />
            </div>
          </div>
          <div v-else class="mt-4">
            <div>Số dư quỹ dự kiến</div>
            <div>
              <InputMoney :value="moneyTopUp" disabled textAlign="right" />
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4 py-4">
        <div class="flex gap-4">
          <VueButton type="reset" icon="close" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton icon="print" @click="startPrintPayment">In phiếu thu</VueButton>
          <VueButton
            type="submit"
            color="blue"
            :loading="saveLoading"
            icon="save"
            style="margin-left: auto"
          >
            Xác nhận thanh toán
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <ModalCustomerUpsert ref="modalCustomerUpsert" />
</template>
