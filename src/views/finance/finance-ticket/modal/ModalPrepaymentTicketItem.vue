<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { InputCheckbox, InputMoney, InputSelect, InputText } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Customer } from '@/modules/customer'
import { PaymentMoneyStatus } from '@/modules/enum'
import { MoneyDirection, Payment, PaymentApi, PaymentPersonType } from '@/modules/payment'
import { PaymentItem, PaymentVoucherItemType, PaymentVoucherType } from '@/modules/payment-item'
import { PaymentMethodService, type PaymentMethod } from '@/modules/payment-method'
import { PrintHtmlAction } from '@/modules/print-html'
import { Ticket, TicketService } from '@/modules/ticket'
import type { TicketLaboratory } from '@/modules/ticket-laboratory'
import type { TicketProcedure } from '@/modules/ticket-procedure'
import type { TicketProduct } from '@/modules/ticket-product'
import type { TicketRadiology } from '@/modules/ticket-radiology'
import { ESArray } from '@/utils'
import { computed, onMounted, ref } from 'vue'
import PaymentMoneyStatusTooltip from '../../payment/PaymentMoneyStatusTooltip.vue'

const emit = defineEmits<{ (e: 'success'): void }>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission, organization } = MeService

const showModal = ref(false)
const dataLoading = ref(false)
const ticket = ref(Ticket.blank())

const paymentMethodId = ref<number>(0)
const note = ref('')
const paymentMethodOptions = ref<{ value: any; label: string }[]>([])
const paymentMethodMap = ref<Record<string, PaymentMethod>>({})
const pickAll = ref(false)

const checkboxProcedure = ref<Record<string, TicketProcedure | undefined>>({})
const checkboxPrescription = ref<Record<string, TicketProduct | undefined>>({})
const checkboxConsumable = ref<Record<string, TicketProduct | undefined>>({})
const checkboxLaboratory = ref<Record<string, TicketLaboratory | undefined>>({})
const checkboxRadiology = ref<Record<string, TicketRadiology | undefined>>({})

onMounted(async () => {
  const paymentMethodAll = await PaymentMethodService.list({ sort: { priority: 'ASC' } })
  paymentMethodMap.value = ESArray.arrayToKeyValue(paymentMethodAll, 'id')
  paymentMethodOptions.value = paymentMethodAll.map((i) => ({ value: i.id, label: i.name }))
  paymentMethodId.value = paymentMethodAll[0]?.id || 0
})

const totalMoney = computed(() => {
  const procedureMoney = Object.entries(checkboxProcedure.value)
    .filter(([id, value]) => !!value)
    .reduce((acc, [id, value]) => acc + value!.quantity * value!.actualPrice, 0)
  const prescriptionMoney = Object.entries(checkboxPrescription.value)
    .filter(([id, value]) => !!value)
    .reduce((acc, [id, value]) => acc + value!.quantity * value!.actualPrice, 0)
  const consumableMoney = Object.entries(checkboxConsumable.value)
    .filter(([id, value]) => !!value)
    .reduce((acc, [id, value]) => acc + value!.quantity * value!.actualPrice, 0)
  const laboratoryMoney = Object.entries(checkboxLaboratory.value)
    .filter(([id, value]) => !!value)
    .reduce((acc, [id, value]) => acc + value!.actualPrice, 0)
  const radiologyMoney = Object.entries(checkboxRadiology.value)
    .filter(([id, value]) => !!value)
    .reduce((acc, [id, value]) => acc + value!.actualPrice, 0)
  return procedureMoney + prescriptionMoney + consumableMoney + laboratoryMoney + radiologyMoney
})

const openModal = async (options: { ticketId: number; customer: Customer }) => {
  showModal.value = true
  const { ticketId } = options
  try {
    dataLoading.value = true
    const ticketResponse = await TicketService.detail(ticketId, {
      relation: {
        ticketProcedureList: {
          filter: {
            paymentMoneyStatus: PaymentMoneyStatus.Pending,
          },
        },
        ticketProductConsumableList: {
          filter: {
            paymentMoneyStatus: PaymentMoneyStatus.Pending,
          },
        },
        ticketProductPrescriptionList: {
          filter: {
            paymentMoneyStatus: PaymentMoneyStatus.Pending,
          },
        },
        ticketLaboratoryList: {
          filter: {
            paymentMoneyStatus: PaymentMoneyStatus.Pending,
          },
        },
        ticketRadiologyList: {
          filter: {
            paymentMoneyStatus: PaymentMoneyStatus.Pending,
          },
        },
      },
    })
    ticketResponse.customer = Customer.from(options.customer)
    await ticketResponse.refreshAllData()
    ticket.value = ticketResponse
  } catch (error) {
    console.log('🚀 ~ ModalTicketClinicPayment.vue:67 ~ openModal ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

const closeModal = () => {
  showModal.value = false
  note.value = ''
  paymentMethodId.value = 0
  ticket.value = Ticket.blank()
  pickAll.value = false

  checkboxProcedure.value = {}
  checkboxPrescription.value = {}
  checkboxConsumable.value = {}
  checkboxLaboratory.value = {}
  checkboxRadiology.value = {}
}

const startPickAll = (v: boolean) => {
  checkboxProcedure.value = {}
  checkboxConsumable.value = {}
  checkboxPrescription.value = {}
  checkboxLaboratory.value = {}
  checkboxRadiology.value = {}

  if (v) {
    ticket.value.ticketProcedureList?.forEach((i) => {
      checkboxProcedure.value[i.id] = i
    })
    ticket.value.ticketProductConsumableList?.forEach((i) => {
      checkboxConsumable.value[i.id] = i
    })
    ticket.value.ticketProductPrescriptionList?.forEach((i) => {
      checkboxPrescription.value[i.id] = i
    })

    ticket.value.ticketLaboratoryList?.forEach((i) => {
      checkboxLaboratory.value[i.id] = i
    })
    ticket.value.ticketRadiologyList?.forEach((i) => {
      checkboxRadiology.value[i.id] = i
    })
  }
}

const startPrepayment = async (options?: { print: boolean }) => {
  try {
    const { paymentCreated } = await PaymentApi.customerPayment({
      body: {
        customerId: ticket.value.customerId,
        note: note.value,
        reason: 'Thanh toán',
        paymentMethodId: paymentMethodId.value,
        totalMoney: totalMoney.value,
        paymentItemData: {
          moneyTopUpAdd: 0,
          payDebt: [],
          prepayment: {
            ticketId: ticket.value.id,
            itemList: [
              ...Object.entries(checkboxProcedure.value)
                .filter(([id, value]) => !!value)
                .map(([id, value]) => {
                  return {
                    ticketItemId: value!.id,
                    voucherItemType: PaymentVoucherItemType.TicketProcedure,
                    paymentInteractId: value!.procedureId,
                    expectedPrice: value!.expectedPrice,
                    actualPrice: value!.actualPrice,
                    quantity: value!.quantity,
                    discountMoney: value!.discountMoney,
                    discountPercent: value!.discountPercent,
                    paidAmount: value!.quantity * value!.actualPrice,
                  }
                }),
              ...Object.entries(checkboxConsumable.value)
                .filter(([id, value]) => !!value)
                .map(([id, value]) => {
                  return {
                    ticketItemId: value!.id,
                    paymentInteractId: value!.productId,
                    voucherItemType: PaymentVoucherItemType.TicketProductConsumable,
                    expectedPrice: value!.expectedPrice,
                    actualPrice: value!.actualPrice,
                    quantity: value!.quantity,
                    discountMoney: value!.discountMoney,
                    discountPercent: value!.discountPercent,
                    paidAmount: value!.quantity * value!.actualPrice,
                  }
                }),
              ...Object.entries(checkboxPrescription.value)
                .filter(([id, value]) => !!value)
                .map(([id, value]) => {
                  return {
                    ticketItemId: value!.id,
                    paymentInteractId: value!.productId,
                    voucherItemType: PaymentVoucherItemType.TicketProductPrescription,
                    expectedPrice: value!.expectedPrice,
                    actualPrice: value!.actualPrice,
                    quantity: value!.quantity,
                    discountMoney: value!.discountMoney,
                    discountPercent: value!.discountPercent,
                    paidAmount: value!.quantity * value!.actualPrice,
                  }
                }),
              ...Object.entries(checkboxLaboratory.value)
                .filter(([id, value]) => !!value)
                .map(([id, value]) => {
                  return {
                    ticketItemId: value!.id,
                    paymentInteractId: value!.laboratoryId,
                    voucherItemType: PaymentVoucherItemType.TicketLaboratory,
                    expectedPrice: value!.expectedPrice,
                    actualPrice: value!.actualPrice,
                    quantity: 1,
                    discountMoney: value!.discountMoney,
                    discountPercent: value!.discountPercent,
                    paidAmount: 1 * value!.actualPrice,
                  }
                }),
              ...Object.entries(checkboxRadiology.value)
                .filter(([id, value]) => !!value)
                .map(([id, value]) => {
                  return {
                    ticketItemId: value!.id,
                    paymentInteractId: value!.radiologyId,
                    voucherItemType: PaymentVoucherItemType.TicketRadiology,
                    expectedPrice: value!.expectedPrice,
                    actualPrice: value!.actualPrice,
                    quantity: 1,
                    discountMoney: value!.discountMoney,
                    discountPercent: value!.discountPercent,
                    paidAmount: 1 * value!.actualPrice,
                  }
                }),
            ],
          },
        },
      },
    })

    if (options?.print) {
      const paymentPrint = await Payment.refreshData(paymentCreated)
      await PrintHtmlAction.startPrintCustomerPayment({
        customer: ticket.value.customer!,
        payment: paymentPrint,
      })
    }

    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalPrepaymentTicketItem.vue:216 ~ startPrepayment ~ error:', error)
  }
}

const startPint = async (options?: { print: boolean }) => {
  try {
    const paymentTemp = Payment.blank()
    paymentTemp.personId = ticket.value.customerId
    paymentTemp.paymentPersonType = PaymentPersonType.Customer
    paymentTemp.createdAt = Date.now()
    paymentTemp.moneyDirection = MoneyDirection.In
    paymentTemp.money = totalMoney.value
    paymentTemp.cashierId = MeService.user.value!.id
    paymentTemp.note = note.value
    paymentTemp.reason = 'Thanh toán'
    paymentTemp.paymentMethodId = paymentMethodId.value

    const paymentItemProcedure: PaymentItem[] = Object.entries(checkboxProcedure.value)
      .filter(([id, value]) => !!value)
      .map(([id, value]) => {
        const paymentItem = PaymentItem.blank()
        paymentItem.voucherType = PaymentVoucherType.Ticket
        paymentItem.voucherItemType = PaymentVoucherItemType.TicketProcedure
        paymentItem.voucherItemId = value!.id
        paymentItem.paymentInteractId = value!.procedureId

        paymentItem.expectedPrice = value!.expectedPrice
        paymentItem.actualPrice = value!.actualPrice
        paymentItem.quantity = value!.quantity
        paymentItem.discountMoney = value!.discountMoney
        paymentItem.discountPercent = value!.discountPercent
        paymentItem.paidAmount = value!.quantity * value!.actualPrice
        return paymentItem
      })

    const paymentItemConsumable: PaymentItem[] = Object.entries(checkboxConsumable.value)
      .filter(([id, value]) => !!value)
      .map(([id, value]) => {
        const paymentItem = PaymentItem.blank()
        paymentItem.voucherType = PaymentVoucherType.Ticket
        paymentItem.voucherItemType = PaymentVoucherItemType.TicketProductConsumable
        paymentItem.voucherItemId = value!.id
        paymentItem.paymentInteractId = value!.productId

        paymentItem.expectedPrice = value!.expectedPrice
        paymentItem.actualPrice = value!.actualPrice
        paymentItem.quantity = value!.quantity
        paymentItem.discountMoney = value!.discountMoney
        paymentItem.discountPercent = value!.discountPercent
        paymentItem.paidAmount = value!.quantity * value!.actualPrice
        return paymentItem
      })

    const paymentItemPrescription: PaymentItem[] = Object.entries(checkboxPrescription.value)
      .filter(([id, value]) => !!value)
      .map(([id, value]) => {
        const paymentItem = PaymentItem.blank()
        paymentItem.voucherType = PaymentVoucherType.Ticket
        paymentItem.voucherItemType = PaymentVoucherItemType.TicketProductPrescription
        paymentItem.voucherItemId = value!.id
        paymentItem.paymentInteractId = value!.productId

        paymentItem.expectedPrice = value!.expectedPrice
        paymentItem.actualPrice = value!.actualPrice
        paymentItem.quantity = value!.quantity
        paymentItem.discountMoney = value!.discountMoney
        paymentItem.discountPercent = value!.discountPercent
        paymentItem.paidAmount = value!.quantity * value!.actualPrice
        return paymentItem
      })

    const paymentItemLaboratory: PaymentItem[] = Object.entries(checkboxLaboratory.value)
      .filter(([id, value]) => !!value)
      .map(([id, value]) => {
        const paymentItem = PaymentItem.blank()
        paymentItem.voucherType = PaymentVoucherType.Ticket
        paymentItem.voucherItemType = PaymentVoucherItemType.TicketLaboratory
        paymentItem.voucherItemId = value!.id
        paymentItem.paymentInteractId = value!.laboratoryId

        paymentItem.expectedPrice = value!.expectedPrice
        paymentItem.actualPrice = value!.actualPrice
        paymentItem.quantity = 1
        paymentItem.discountMoney = value!.discountMoney
        paymentItem.discountPercent = value!.discountPercent
        paymentItem.paidAmount = 1 * value!.actualPrice
        return paymentItem
      })

    const paymentItemRadiology: PaymentItem[] = Object.entries(checkboxRadiology.value)
      .filter(([id, value]) => !!value)
      .map(([id, value]) => {
        const paymentItem = PaymentItem.blank()
        paymentItem.voucherType = PaymentVoucherType.Ticket
        paymentItem.voucherItemType = PaymentVoucherItemType.TicketRadiology
        paymentItem.voucherItemId = value!.id
        paymentItem.paymentInteractId = value!.radiologyId

        paymentItem.expectedPrice = value!.expectedPrice
        paymentItem.actualPrice = value!.actualPrice
        paymentItem.quantity = 1
        paymentItem.discountMoney = value!.discountMoney
        paymentItem.discountPercent = value!.discountPercent
        paymentItem.paidAmount = 1 * value!.actualPrice
        return paymentItem
      })

    paymentTemp.paymentItemList = [
      ...paymentItemProcedure,
      ...paymentItemConsumable,
      ...paymentItemPrescription,
      ...paymentItemLaboratory,
      ...paymentItemRadiology,
    ]

    const paymentPrint = await Payment.refreshData(paymentTemp)
    await PrintHtmlAction.startPrintCustomerPayment({
      customer: ticket.value.customer!,
      payment: paymentPrint,
    })
  } catch (error) {
    console.log('🚀 ~ ModalPrepaymentTicketItem.vue:380 ~ startPint ~ error:', error)
  }
}

const disabledButtonSave = computed(() => {
  if (totalMoney.value === 0) {
    return true
  }
  return false
})

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 40px; width: 800px" @close="closeModal">
    <div class="bg-white">
      <div class="pl-4 pb-2 pt-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          Thông tin thanh toán: {{ ticket.customer?.fullName }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <div class="table-wrapper">
          <table v-if="dataLoading">
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
          </table>
          <table
            v-else-if="
              !ticket.ticketProcedureList?.length &&
              !ticket.ticketProductPrescriptionList?.length &&
              !ticket.ticketProductConsumableList?.length &&
              !ticket.ticketLaboratoryList?.length &&
              !ticket.ticketRadiologyList?.length
            "
          >
            <thead>
              <tr>
                <th>#</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Không có dịch vụ nào cần thanh toán</td>
              </tr>
            </tbody>
          </table>
          <table v-else>
            <template v-if="ticket.ticketProcedureList?.length">
              <thead>
                <tr>
                  <th v-if="CONFIG.MODE === 'development'">ID</th>
                  <th>Chọn</th>
                  <th>#</th>
                  <th></th>
                  <th>
                    <span>Dịch vụ</span>
                  </th>
                  <th>Giá tiền</th>
                  <th>Số lượng</th>
                  <th>Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(ticketProcedure, index) in ticket.ticketProcedureList"
                  :key="ticketProcedure.id"
                >
                  <td
                    v-if="CONFIG.MODE === 'development'"
                    style="text-align: center; color: violet"
                  >
                    {{ ticketProcedure.id }}
                  </td>
                  <td>
                    <div class="flex justify-center">
                      <InputCheckbox
                        :checked="!!checkboxProcedure[ticketProcedure.id]"
                        @update:checked="
                          (v) =>
                            (checkboxProcedure[ticketProcedure.id] = v
                              ? ticketProcedure
                              : undefined)
                        "
                      />
                    </div>
                  </td>
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>
                    <PaymentMoneyStatusTooltip
                      :paymentMoneyStatus="ticketProcedure.paymentMoneyStatus"
                    />
                  </td>
                  <td>{{ ticketProcedure.procedure?.name }}</td>
                  <td class="text-right whitespace-nowrap">
                    <div v-if="ticketProcedure.discountMoney" class="text-xs italic text-red-500">
                      <del>{{ formatMoney(ticketProcedure.expectedPrice) }}</del>
                    </div>
                    <div>{{ formatMoney(ticketProcedure.actualPrice) }}</div>
                  </td>
                  <td class="text-center">{{ ticketProcedure.quantity }}</td>
                  <td class="text-right whitespace-nowrap">
                    <div v-if="ticketProcedure.discountMoney" class="text-xs italic text-red-500">
                      <del>
                        {{ formatMoney(ticketProcedure.expectedPrice * ticketProcedure.quantity) }}
                      </del>
                    </div>
                    <div>
                      {{ formatMoney(ticketProcedure.actualPrice * ticketProcedure.quantity) }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </template>
            <template v-if="ticket.ticketProductConsumableList?.length">
              <thead>
                <tr>
                  <th v-if="CONFIG.MODE === 'development'">ID</th>
                  <th>Chọn</th>
                  <th>#</th>
                  <th></th>
                  <th>
                    <span>Vật tư</span>
                  </th>
                  <th>Giá tiền</th>
                  <th>Số lượng</th>
                  <th>Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(ticketConsumable, index) in ticket.ticketProductConsumableList"
                  :key="ticketConsumable.id"
                >
                  <td
                    v-if="CONFIG.MODE === 'development'"
                    style="text-align: center; color: violet"
                  >
                    {{ ticketConsumable.id }}
                  </td>
                  <td>
                    <div class="flex justify-center">
                      <InputCheckbox
                        :checked="!!checkboxConsumable[ticketConsumable.id]"
                        @update:checked="
                          (v) =>
                            (checkboxConsumable[ticketConsumable.id] = v
                              ? ticketConsumable
                              : undefined)
                        "
                      />
                    </div>
                  </td>
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>
                    <PaymentMoneyStatusTooltip
                      :paymentMoneyStatus="ticketConsumable.paymentMoneyStatus"
                    />
                  </td>
                  <td>{{ ticketConsumable.product?.brandName }}</td>
                  <td class="text-right whitespace-nowrap">
                    <div v-if="ticketConsumable.discountMoney" class="text-xs italic text-red-500">
                      <del>{{ formatMoney(ticketConsumable.expectedPrice) }}</del>
                    </div>
                    <div>{{ formatMoney(ticketConsumable.actualPrice) }}</div>
                  </td>
                  <td class="text-center">{{ ticketConsumable.quantity }}</td>
                  <td class="text-right whitespace-nowrap">
                    {{ formatMoney(ticketConsumable.actualPrice * ticketConsumable.quantity) }}
                  </td>
                </tr>
              </tbody>
            </template>
            <template v-if="ticket.ticketProductPrescriptionList?.length">
              <thead>
                <tr>
                  <th v-if="CONFIG.MODE === 'development'">ID</th>
                  <th>Chọn</th>
                  <th>#</th>
                  <th></th>
                  <th>
                    <span>Thuốc</span>
                  </th>
                  <th>Giá tiền</th>
                  <th>Số lượng</th>
                  <th>Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(ticketPrescription, index) in ticket.ticketProductPrescriptionList"
                  :key="ticketPrescription.id"
                >
                  <td
                    v-if="CONFIG.MODE === 'development'"
                    style="text-align: center; color: violet"
                  >
                    {{ ticketPrescription.id }}
                  </td>
                  <td>
                    <div class="flex justify-center">
                      <InputCheckbox
                        :checked="!!checkboxPrescription[ticketPrescription.id]"
                        @update:checked="
                          (v) =>
                            (checkboxPrescription[ticketPrescription.id] = v
                              ? ticketPrescription
                              : undefined)
                        "
                      />
                    </div>
                  </td>
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>
                    <PaymentMoneyStatusTooltip
                      :paymentMoneyStatus="ticketPrescription.paymentMoneyStatus"
                    />
                  </td>
                  <td>{{ ticketPrescription.product?.brandName }}</td>
                  <td class="text-right whitespace-nowrap">
                    <div
                      v-if="ticketPrescription.discountMoney"
                      class="text-xs italic text-red-500"
                    >
                      <del>{{ formatMoney(ticketPrescription.expectedPrice) }}</del>
                    </div>
                    <div>{{ formatMoney(ticketPrescription.actualPrice) }}</div>
                  </td>
                  <td class="text-center">{{ ticketPrescription.quantity }}</td>
                  <td class="text-right whitespace-nowrap">
                    {{ formatMoney(ticketPrescription.actualPrice * ticketPrescription.quantity) }}
                  </td>
                </tr>
              </tbody>
            </template>
            <template v-if="ticket.ticketLaboratoryList?.length">
              <thead>
                <tr>
                  <th v-if="CONFIG.MODE === 'development'">ID</th>
                  <th>Chọn</th>
                  <th>#</th>
                  <th></th>
                  <th>
                    <span>Xét nghiệm</span>
                  </th>
                  <th></th>
                  <th></th>
                  <th>Giá tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(ticketLaboratory, index) in ticket.ticketLaboratoryList"
                  :key="ticketLaboratory.id"
                >
                  <td
                    v-if="CONFIG.MODE === 'development'"
                    style="text-align: center; color: violet"
                  >
                    {{ ticketLaboratory.id }}
                  </td>
                  <td>
                    <div class="flex justify-center">
                      <InputCheckbox
                        :checked="!!checkboxLaboratory[ticketLaboratory.id]"
                        @update:checked="
                          (v) =>
                            (checkboxLaboratory[ticketLaboratory.id] = v
                              ? ticketLaboratory
                              : undefined)
                        "
                      />
                    </div>
                  </td>
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>
                    <PaymentMoneyStatusTooltip
                      :paymentMoneyStatus="ticketLaboratory.paymentMoneyStatus"
                    />
                  </td>
                  <td colspan="3">{{ ticketLaboratory.laboratory?.name }}</td>
                  <td class="text-right whitespace-nowrap">
                    <div v-if="ticketLaboratory.discountMoney" class="text-xs italic text-red-500">
                      <del>{{ formatMoney(ticketLaboratory.expectedPrice) }}</del>
                    </div>
                    <div>{{ formatMoney(ticketLaboratory.actualPrice) }}</div>
                  </td>
                </tr>
              </tbody>
            </template>
            <template v-if="ticket.ticketRadiologyList?.length">
              <thead>
                <tr>
                  <th v-if="CONFIG.MODE === 'development'">ID</th>
                  <th>Chọn</th>
                  <th>#</th>
                  <th></th>
                  <th>
                    <span>Phiếu CĐHA</span>
                  </th>
                  <th></th>
                  <th></th>
                  <th>Giá tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(ticketRadiology, index) in ticket.ticketRadiologyList"
                  :key="ticketRadiology.id"
                >
                  <td
                    v-if="CONFIG.MODE === 'development'"
                    style="text-align: center; color: violet"
                  >
                    {{ ticketRadiology.id }}
                  </td>
                  <td>
                    <div class="flex justify-center">
                      <InputCheckbox
                        :checked="!!checkboxRadiology[ticketRadiology.id]"
                        @update:checked="
                          (v) =>
                            (checkboxRadiology[ticketRadiology.id] = v
                              ? ticketRadiology
                              : undefined)
                        "
                      />
                    </div>
                  </td>
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>
                    <PaymentMoneyStatusTooltip
                      :paymentMoneyStatus="ticketRadiology.paymentMoneyStatus"
                    />
                  </td>
                  <td colspan="3">{{ ticketRadiology.radiology?.name }}</td>
                  <td class="text-right whitespace-nowrap">
                    <div v-if="ticketRadiology.discountMoney" class="text-xs italic text-red-500">
                      <del>{{ formatMoney(ticketRadiology.expectedPrice) }}</del>
                    </div>
                    <div>{{ formatMoney(ticketRadiology.actualPrice) }}</div>
                  </td>
                </tr>
              </tbody>
            </template>
          </table>
        </div>
        <div class="mt-2 ml-2 flex justify-center">
          <InputCheckbox v-model:value="pickAll" @update:checked="startPickAll">
            <a class="underline">Chọn tất cả</a>
          </InputCheckbox>
        </div>
        <div class="flex flex-wrap gap-4 mt-4">
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <div>Phương thức thanh toán</div>
            <div>
              <InputSelect v-model:value="paymentMethodId" :options="paymentMethodOptions" />
            </div>
          </div>
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <div class="flex flex-wrap justify-between">
              <span>Số tiền thanh toán</span>
            </div>
            <div>
              <div class="flex">
                <InputMoney
                  ref="inputMoneyPay"
                  :value="totalMoney"
                  textAlign="right"
                  :validate="{ gt: 0 }"
                  required
                  disabled
                />
              </div>
            </div>
          </div>
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <div class="flex flex-wrap justify-between">
              <span>Ghi chú</span>
            </div>
            <div>
              <div class="flex">
                <InputText v-model:value="note" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="pb-4 pt-8 px-4 flex flex-wrap item-center gap-4">
        <VueButton type="reset" @click="closeModal" icon="close">Đóng lại</VueButton>
        <VueButton
          color="blue"
          @click="startPint"
          icon="print"
          style="margin-left: auto"
          :disabled="disabledButtonSave"
        >
          In
        </VueButton>
        <VueButton
          color="blue"
          @click="startPrepayment"
          icon="dollar"
          :disabled="disabledButtonSave"
        >
          Xác nhận thanh toán
        </VueButton>
      </div>
    </div>
  </VueModal>
</template>
