<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { InputCheckbox, InputMoney, InputSelect, InputText } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Customer } from '@/modules/customer'
import { DiscountType, PaymentMoneyStatus } from '@/modules/enum'
import {
  MoneyDirection,
  Payment,
  PaymentApi,
  PaymentPersonType,
  PaymentVoucherType,
} from '@/modules/payment'
import { PaymentMethodService, type PaymentMethod } from '@/modules/payment-method'
import { PrintHtmlAction } from '@/modules/print-html'
import { Ticket, TicketMoneyApi, TicketService } from '@/modules/ticket'
import type { TicketLaboratory } from '@/modules/ticket-laboratory'
import type { TicketProcedure } from '@/modules/ticket-procedure'
import type { TicketProduct } from '@/modules/ticket-product'
import type { TicketRadiology } from '@/modules/ticket-radiology'
import { ESArray } from '@/utils'
import { computed, onMounted, ref } from 'vue'
import PaymentMoneyStatusTooltip from '../../payment/PaymentMoneyStatusTooltip.vue'
import { PaymentTicketItem, TicketItemType } from '@/modules/payment-ticket-item'
import type { TicketRegimen } from '@/modules/ticket-regimen'

const emit = defineEmits<{ (e: 'success'): void }>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission, organization } = MeService

const showModal = ref(false)
const dataLoading = ref(false)
const ticket = ref(Ticket.blank())

const ticketRegimenRefund = ref<TicketRegimen[]>([])
const ticketProcedureRefund = ref<TicketProcedure[]>([])
const ticketConsumableRefund = ref<TicketProduct[]>([])
const ticketPrescriptionRefund = ref<TicketProduct[]>([])
const ticketLaboratoryRefund = ref<TicketLaboratory[]>([])
const ticketRadiologyRefund = ref<TicketRadiology[]>([])

const paymentMethodId = ref<number>(0)
const note = ref('')
const paymentMethodOptions = ref<{ value: any; label: string }[]>([])
const pickAll = ref(false)

const checkboxRegimen = ref<Record<string, TicketRegimen | undefined>>({})
const checkboxProcedure = ref<Record<string, TicketProcedure | undefined>>({})
const checkboxConsumable = ref<Record<string, TicketProduct | undefined>>({})
const checkboxPrescription = ref<Record<string, TicketProduct | undefined>>({})
const checkboxLaboratory = ref<Record<string, TicketLaboratory | undefined>>({})
const checkboxRadiology = ref<Record<string, TicketRadiology | undefined>>({})

onMounted(async () => {
  const paymentMethodAll = await PaymentMethodService.list({ sort: { priority: 'ASC' } })
  paymentMethodOptions.value = paymentMethodAll.map((i) => ({ value: i.id, label: i.name }))
  paymentMethodId.value = paymentMethodAll[0]?.id || 0
})

const totalMoney = computed(() => {
  const regimenMoney = Object.entries(checkboxRegimen.value)
    .filter(([id, value]) => !!value)
    .reduce((acc, [id, value]) => acc + value!.moneyAmountWallet, 0)
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
  return (
    regimenMoney +
    procedureMoney +
    prescriptionMoney +
    consumableMoney +
    laboratoryMoney +
    radiologyMoney
  )
})

const refreshData = async () => {
  await ticket.value.refreshAllData()

  ticketRegimenRefund.value = (ticket.value.ticketRegimenList || []).filter((i) => {
    return i.moneyAmountWallet !== 0
  })
  ticketProcedureRefund.value = (ticket.value.ticketProcedureList || []).filter((i) => {
    return i.paymentMoneyStatus === PaymentMoneyStatus.FullPaid
  })
  ticketConsumableRefund.value = (ticket.value.ticketProductConsumableList || []).filter((i) => {
    return i.paymentMoneyStatus === PaymentMoneyStatus.FullPaid
  })
  ticketPrescriptionRefund.value = (ticket.value.ticketProductPrescriptionList || []).filter(
    (i) => {
      return i.paymentMoneyStatus === PaymentMoneyStatus.FullPaid
    },
  )
  ticketLaboratoryRefund.value = (ticket.value.ticketLaboratoryList || []).filter((i) => {
    return i.paymentMoneyStatus === PaymentMoneyStatus.FullPaid
  })
  ticketRadiologyRefund.value = (ticket.value.ticketRadiologyList || []).filter((i) => {
    return i.paymentMoneyStatus === PaymentMoneyStatus.FullPaid
  })

  checkboxRegimen.value = {}
  checkboxProcedure.value = {}
  checkboxConsumable.value = {}
  checkboxPrescription.value = {}
  checkboxLaboratory.value = {}
  checkboxRadiology.value = {}

  note.value = ''
  paymentMethodId.value = 0
  pickAll.value = false
}

const openModal = async (options: { ticketId: string; customer: Customer }) => {
  showModal.value = true
  const { ticketId } = options
  try {
    dataLoading.value = true
    const ticketResponse = await TicketService.detail(ticketId, {
      relation: {
        ticketRegimenList: true,
        ticketRegimenItemList: true,
        ticketProcedureList: true,
        ticketProductList: { batch: true, product: true },
        ticketLaboratoryList: true,
        ticketRadiologyList: true,
      },
    })
    ticketResponse.customer = Customer.from(options.customer)
    await ticketResponse.refreshAllData()
    await refreshData()
    ticket.value = ticketResponse
  } catch (error) {
    console.log('🚀 ~ ModalTicketClinicPayment.vue:67 ~ openModal ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

const openModalByTicket = async (ticketProps: Ticket) => {
  ticket.value = Ticket.from(ticketProps)
  await refreshData()
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  note.value = ''
  paymentMethodId.value = 0
  ticket.value = Ticket.blank()
  pickAll.value = false

  checkboxRegimen.value = {}
  checkboxProcedure.value = {}
  checkboxConsumable.value = {}
  checkboxPrescription.value = {}
  checkboxLaboratory.value = {}
  checkboxRadiology.value = {}
}

const startPickAll = (v: boolean) => {
  checkboxRegimen.value = {}
  checkboxProcedure.value = {}
  checkboxConsumable.value = {}
  checkboxPrescription.value = {}
  checkboxLaboratory.value = {}
  checkboxRadiology.value = {}

  if (v) {
    ticketRegimenRefund.value?.forEach((i) => {
      checkboxRegimen.value[i.id] = i
    })
    ticketProcedureRefund.value?.forEach((i) => {
      checkboxProcedure.value[i.id] = i
    })
    ticketConsumableRefund.value?.forEach((i) => {
      checkboxConsumable.value[i.id] = i
    })
    ticketPrescriptionRefund.value?.forEach((i) => {
      checkboxPrescription.value[i.id] = i
    })
    ticketLaboratoryRefund.value?.forEach((i) => {
      checkboxLaboratory.value[i.id] = i
    })
    ticketRadiologyRefund.value?.forEach((i) => {
      checkboxRadiology.value[i.id] = i
    })
  }
}

const startRefund = async (options?: { print: boolean }) => {
  try {
    const { ticketModified, paymentCreated } = await TicketMoneyApi.refundTicketItemList({
      ticketId: ticket.value.id,
      body: {
        customerId: ticket.value.customerId,
        paymentMethodId: paymentMethodId.value,
        refundAmount: totalMoney.value,
        note: note.value,
        ticketRegimenBodyList: Object.values(checkboxRegimen.value).map((value) => {
          return {
            ticketItemId: value!.id,
            ticketItemType: TicketItemType.TicketRegimen,
            interactId: value!.regimenId,
            expectedPrice: value!.moneyAmountWallet,
            discountMoney: 0,
            discountPercent: 0,
            discountType: DiscountType.VND,
            actualPrice: value!.moneyAmountWallet,
            quantity: 1,
            sessionIndex: 0,
            paymentMoneyStatus: PaymentMoneyStatus.PendingPayment, // để tạm để validate chứ không sử dụng
          }
        }),
        ticketProcedureBodyList: Object.entries(checkboxProcedure.value)
          .filter(([id, value]) => !!value)
          .map(([id, value]) => {
            return {
              ticketItemId: value!.id,
              ticketItemType: TicketItemType.TicketProcedure,
              interactId: value!.procedureId,
              expectedPrice: value!.expectedPrice,
              discountMoney: value!.discountMoney,
              discountPercent: value!.discountPercent,
              discountType: value!.discountType,
              actualPrice: value!.actualPrice,
              quantity: value!.quantity,
              sessionIndex: value!.indexSession,
              paymentMoneyStatus: value!.paymentMoneyStatus,
            }
          }),
        ticketProductConsumableBodyList: Object.entries(checkboxConsumable.value)
          .filter(([id, value]) => !!value)
          .map(([id, value]) => {
            return {
              ticketItemId: value!.id,
              interactId: value!.productId,
              ticketItemType: TicketItemType.TicketProductConsumable,
              expectedPrice: value!.expectedPrice,
              discountMoney: value!.discountMoney,
              discountPercent: value!.discountPercent,
              discountType: value!.discountType,
              actualPrice: value!.actualPrice,
              quantity: value!.quantity,
              sessionIndex: 0,
              paymentMoneyStatus: value!.paymentMoneyStatus,
            }
          }),
        ticketProductPrescriptionBodyList: Object.entries(checkboxPrescription.value)
          .filter(([id, value]) => !!value)
          .map(([id, value]) => {
            return {
              ticketItemId: value!.id,
              interactId: value!.productId,
              ticketItemType: TicketItemType.TicketProductPrescription,
              expectedPrice: value!.expectedPrice,
              discountMoney: value!.discountMoney,
              discountPercent: value!.discountPercent,
              discountType: value!.discountType,
              actualPrice: value!.actualPrice,
              quantity: value!.quantity,
              sessionIndex: 0,
              paymentMoneyStatus: value!.paymentMoneyStatus,
            }
          }),
        ticketLaboratoryBodyList: Object.entries(checkboxLaboratory.value)
          .filter(([id, value]) => !!value)
          .map(([id, value]) => {
            return {
              ticketItemId: value!.id,
              interactId: value!.laboratoryId,
              ticketItemType: TicketItemType.TicketLaboratory,
              expectedPrice: value!.expectedPrice,
              discountMoney: value!.discountMoney,
              discountPercent: value!.discountPercent,
              discountType: value!.discountType,
              actualPrice: value!.actualPrice,
              quantity: 1,
              sessionIndex: 0,
              paymentMoneyStatus: value!.paymentMoneyStatus,
            }
          }),
        ticketRadiologyBodyList: Object.entries(checkboxRadiology.value)
          .filter(([id, value]) => !!value)
          .map(([id, value]) => {
            return {
              ticketItemId: value!.id,
              interactId: value!.radiologyId,
              ticketItemType: TicketItemType.TicketRadiology,
              expectedPrice: value!.expectedPrice,
              discountMoney: value!.discountMoney,
              discountPercent: value!.discountPercent,
              discountType: value!.discountType,
              actualPrice: value!.actualPrice,
              quantity: 1,
              sessionIndex: 0,
              paymentMoneyStatus: value!.paymentMoneyStatus,
            }
          }),
      },
    })

    if (options?.print) {
      const paymentPrint = await Payment.refreshData(paymentCreated)
      await PrintHtmlAction.startPrintCustomerRefund({
        customer: ticket.value.customer!,
        payment: paymentPrint,
      })
    }

    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalPrepaymentTicketItem.vue:216 ~ startRefund ~ error:', error)
  }
}

const startPint = async (options?: { print: boolean }) => {
  try {
    const paymentTemp = Payment.blank()
    paymentTemp.voucherType = PaymentVoucherType.Ticket
    paymentTemp.voucherId = ticket.value.id
    paymentTemp.personType = PaymentPersonType.Customer
    paymentTemp.personId = ticket.value.customerId

    paymentTemp.createdAt = Date.now()
    paymentTemp.moneyDirection = MoneyDirection.Out
    paymentTemp.cashierId = MeService.user.value!.id
    paymentTemp.note = note.value
    paymentTemp.paymentMethodId = paymentMethodId.value

    paymentTemp.paidAmount = totalMoney.value

    const paymentTicketItemRegimen: PaymentTicketItem[] = Object.entries(checkboxRegimen.value)
      .filter(([id, value]) => !!value)
      .map(([id, value]) => {
        const paymentTicketItem = PaymentTicketItem.blank()
        paymentTicketItem.ticketItemType = TicketItemType.TicketRegimen
        paymentTicketItem.ticketItemId = value!.id
        paymentTicketItem.interactId = value!.regimenId

        paymentTicketItem.expectedPrice = value!.moneyAmountWallet
        paymentTicketItem.discountMoney = 0
        paymentTicketItem.discountPercent = 0
        paymentTicketItem.discountType = DiscountType.VND
        paymentTicketItem.actualPrice = value!.moneyAmountWallet
        paymentTicketItem.quantity = 1

        return paymentTicketItem
      })

    const paymentTicketItemProcedure: PaymentTicketItem[] = Object.entries(checkboxProcedure.value)
      .filter(([id, value]) => !!value)
      .map(([id, value]) => {
        const paymentTicketItem = PaymentTicketItem.blank()
        paymentTicketItem.ticketItemType = TicketItemType.TicketProcedure
        paymentTicketItem.ticketItemId = value!.id
        paymentTicketItem.interactId = value!.procedureId

        paymentTicketItem.expectedPrice = value!.expectedPrice
        paymentTicketItem.discountMoney = value!.discountMoney
        paymentTicketItem.discountPercent = value!.discountPercent
        paymentTicketItem.discountType = value!.discountType
        paymentTicketItem.actualPrice = value!.actualPrice
        paymentTicketItem.quantity = value!.quantity
        return paymentTicketItem
      })

    const paymentTicketItemConsumable: PaymentTicketItem[] = Object.entries(
      checkboxConsumable.value,
    )
      .filter(([id, value]) => !!value)
      .map(([id, value]) => {
        const paymentTicketItem = PaymentTicketItem.blank()
        paymentTicketItem.ticketItemType = TicketItemType.TicketProductConsumable
        paymentTicketItem.ticketItemId = value!.id
        paymentTicketItem.interactId = value!.productId

        paymentTicketItem.expectedPrice = value!.expectedPrice
        paymentTicketItem.discountMoney = value!.discountMoney
        paymentTicketItem.discountPercent = value!.discountPercent
        paymentTicketItem.discountType = value!.discountType
        paymentTicketItem.actualPrice = value!.actualPrice
        paymentTicketItem.quantity = value!.quantity
        return paymentTicketItem
      })

    const paymentTicketItemPrescription: PaymentTicketItem[] = Object.entries(
      checkboxPrescription.value,
    )
      .filter(([id, value]) => !!value)
      .map(([id, value]) => {
        const paymentTicketItem = PaymentTicketItem.blank()
        paymentTicketItem.ticketItemType = TicketItemType.TicketProductPrescription
        paymentTicketItem.ticketItemId = value!.id
        paymentTicketItem.interactId = value!.productId

        paymentTicketItem.expectedPrice = value!.expectedPrice
        paymentTicketItem.discountMoney = value!.discountMoney
        paymentTicketItem.discountPercent = value!.discountPercent
        paymentTicketItem.discountType = value!.discountType
        paymentTicketItem.actualPrice = value!.actualPrice
        paymentTicketItem.quantity = value!.quantity
        return paymentTicketItem
      })

    const paymentTicketItemLaboratory: PaymentTicketItem[] = Object.entries(
      checkboxLaboratory.value,
    )
      .filter(([id, value]) => !!value)
      .map(([id, value]) => {
        const paymentTicketItem = PaymentTicketItem.blank()
        paymentTicketItem.ticketItemType = TicketItemType.TicketLaboratory
        paymentTicketItem.ticketItemId = value!.id
        paymentTicketItem.interactId = value!.laboratoryId

        paymentTicketItem.expectedPrice = value!.expectedPrice
        paymentTicketItem.discountMoney = value!.discountMoney
        paymentTicketItem.discountPercent = value!.discountPercent
        paymentTicketItem.discountType = value!.discountType
        paymentTicketItem.actualPrice = value!.actualPrice
        paymentTicketItem.quantity = 1
        return paymentTicketItem
      })

    const paymentTicketItemRadiology: PaymentTicketItem[] = Object.entries(checkboxRadiology.value)
      .filter(([id, value]) => !!value)
      .map(([id, value]) => {
        const paymentTicketItem = PaymentTicketItem.blank()
        paymentTicketItem.ticketItemType = TicketItemType.TicketRadiology
        paymentTicketItem.ticketItemId = value!.id
        paymentTicketItem.interactId = value!.radiologyId

        paymentTicketItem.expectedPrice = value!.expectedPrice
        paymentTicketItem.discountMoney = value!.discountMoney
        paymentTicketItem.discountPercent = value!.discountPercent
        paymentTicketItem.discountType = value!.discountType
        paymentTicketItem.actualPrice = value!.actualPrice
        paymentTicketItem.quantity = 1
        return paymentTicketItem
      })

    paymentTemp.paymentTicketItemList = [
      ...paymentTicketItemRegimen,
      ...paymentTicketItemProcedure,
      ...paymentTicketItemConsumable,
      ...paymentTicketItemPrescription,
      ...paymentTicketItemLaboratory,
      ...paymentTicketItemRadiology,
    ]

    const paymentPrint = await Payment.refreshData(paymentTemp)
    await PrintHtmlAction.startPrintCustomerRefund({
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

defineExpose({ openModal, openModalByTicket })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 40px; width: 800px" @close="closeModal">
    <div class="bg-white">
      <div class="pl-4 pb-2 pt-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          Thông tin hoàn tiền: {{ ticket.customer?.fullName }}
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
              !ticketRegimenRefund.length &&
              !ticketProcedureRefund.length &&
              !ticketConsumableRefund?.length &&
              !ticketPrescriptionRefund?.length &&
              !ticketLaboratoryRefund?.length &&
              !ticketRadiologyRefund?.length
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
            <template v-if="ticketRegimenRefund?.length">
              <thead>
                <tr>
                  <th>Chọn</th>
                  <th>#</th>
                  <th></th>
                  <th>Liệu trình</th>
                  <th></th>
                  <th>Đơn Giá</th>
                  <th>Ví</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(ticketRegimen, index) in ticketRegimenRefund" :key="ticketRegimen.id">
                  <td>
                    <div class="flex justify-center">
                      <InputCheckbox
                        :checked="!!checkboxRegimen[ticketRegimen.id]"
                        @update:checked="
                          (v) => (checkboxRegimen[ticketRegimen.id] = v ? ticketRegimen : undefined)
                        "
                      />
                    </div>
                  </td>
                  <td class="text-center">{{ index + 1 }}</td>
                  <td></td>
                  <td colspan="2">{{ ticketRegimen.regimen?.name }}</td>
                  <td class="text-right whitespace-nowrap">
                    <div v-if="ticketRegimen.discountMoney" class="text-xs italic text-red-500">
                      <del>{{ formatMoney(ticketRegimen.expectedPrice) }}</del>
                    </div>
                    <div>{{ formatMoney(ticketRegimen.actualPrice) }}</div>
                  </td>
                  <td class="text-right whitespace-nowrap">
                    <div>{{ formatMoney(ticketRegimen.moneyAmountWallet) }}</div>
                  </td>
                </tr>
              </tbody>
            </template>
            <template v-if="ticketProcedureRefund?.length">
              <thead>
                <tr>
                  <th>Chọn</th>
                  <th>#</th>
                  <th></th>
                  <th>Dịch vụ</th>
                  <th>Số lượng</th>
                  <th>Đơn Giá</th>
                  <th>Đã Thanh Toán</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(ticketProcedure, index) in ticketProcedureRefund"
                  :key="ticketProcedure.id"
                >
                  <td>
                    <div class="flex justify-center">
                      <InputCheckbox
                        :checked="!!checkboxProcedure[ticketProcedure.id]"
                        @update:checked="
                          (v: any) =>
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
                  <td class="text-center">{{ ticketProcedure.quantity }}</td>
                  <td class="text-right whitespace-nowrap">
                    <div v-if="ticketProcedure.discountMoney" class="text-xs italic text-red-500">
                      <del>{{ formatMoney(ticketProcedure.expectedPrice) }}</del>
                    </div>
                    <div>{{ formatMoney(ticketProcedure.actualPrice) }}</div>
                  </td>
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
            <template v-if="ticketConsumableRefund?.length">
              <thead>
                <tr>
                  <th>Chọn</th>
                  <th>#</th>
                  <th></th>
                  <th>Vật tư</th>
                  <th>Số lượng</th>
                  <th>Đơn Giá</th>
                  <th>Đã Thanh Toán</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(ticketConsumable, index) in ticketConsumableRefund"
                  :key="ticketConsumable.id"
                >
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
                  <td class="text-center">{{ ticketConsumable.quantity }}</td>
                  <td class="text-right whitespace-nowrap">
                    <div v-if="ticketConsumable.discountMoney" class="text-xs italic text-red-500">
                      <del>{{ formatMoney(ticketConsumable.expectedPrice) }}</del>
                    </div>
                    <div>{{ formatMoney(ticketConsumable.actualPrice) }}</div>
                  </td>
                  <td class="text-right whitespace-nowrap">
                    {{ formatMoney(ticketConsumable.actualPrice * ticketConsumable.quantity) }}
                  </td>
                </tr>
              </tbody>
            </template>
            <template v-if="ticketPrescriptionRefund?.length">
              <thead>
                <tr>
                  <th>Chọn</th>
                  <th>#</th>
                  <th></th>
                  <th>Thuốc</th>
                  <th>Số lượng</th>
                  <th>Đơn Giá</th>
                  <th>Đã Thanh Toán</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(ticketPrescription, index) in ticketPrescriptionRefund"
                  :key="ticketPrescription.id"
                >
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
                  <td class="text-center">{{ ticketPrescription.quantity }}</td>
                  <td class="text-right whitespace-nowrap">
                    <div
                      v-if="ticketPrescription.discountMoney"
                      class="text-xs italic text-red-500"
                    >
                      <del>{{ formatMoney(ticketPrescription.expectedPrice) }}</del>
                    </div>
                    <div>{{ formatMoney(ticketPrescription.actualPrice) }}</div>
                  </td>

                  <td class="text-right whitespace-nowrap">
                    {{ formatMoney(ticketPrescription.actualPrice * ticketPrescription.quantity) }}
                  </td>
                </tr>
              </tbody>
            </template>
            <template v-if="ticketLaboratoryRefund?.length">
              <thead>
                <tr>
                  <th>Chọn</th>
                  <th>#</th>
                  <th></th>
                  <th>Xét nghiệm</th>
                  <th></th>
                  <th></th>
                  <th>Đã Thanh Toán</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(ticketLaboratory, index) in ticketLaboratoryRefund"
                  :key="ticketLaboratory.id"
                >
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
            <template v-if="ticketRadiologyRefund?.length">
              <thead>
                <tr>
                  <th>Chọn</th>
                  <th>#</th>
                  <th></th>
                  <th>Phiếu CĐHA</th>
                  <th></th>
                  <th></th>
                  <th>Đã Thanh Toán</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(ticketRadiology, index) in ticketRadiologyRefund"
                  :key="ticketRadiology.id"
                >
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
        <VueButton color="blue" @click="startRefund" icon="dollar" :disabled="disabledButtonSave">
          Xác nhận hoàn tiền
        </VueButton>
      </div>
    </div>
  </VueModal>
</template>
