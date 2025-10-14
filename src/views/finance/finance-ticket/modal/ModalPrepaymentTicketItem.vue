<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { InputCheckbox, InputMoney, InputNumber, InputSelect, InputText } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Customer } from '@/modules/customer'
import { DiscountType, PaymentMoneyStatus } from '@/modules/enum'
import {
  MoneyDirection,
  Payment,
  PaymentActionType,
  PaymentPersonType,
  PaymentVoucherType,
} from '@/modules/payment'
import { PaymentMethodService } from '@/modules/payment-method'
import { PaymentTicketItem, TicketItemType } from '@/modules/payment-ticket-item'
import { PrintHtmlAction } from '@/modules/print-html'
import { Ticket, TicketMoneyApi, TicketService } from '@/modules/ticket'
import type { TicketLaboratory } from '@/modules/ticket-laboratory'
import type { TicketProcedure } from '@/modules/ticket-procedure'
import type { TicketProduct } from '@/modules/ticket-product'
import type { TicketRadiology } from '@/modules/ticket-radiology'
import type { TicketRegimen } from '@/modules/ticket-regimen'
import { computed, onMounted, ref } from 'vue'
import PaymentMoneyStatusTooltip from '../../payment/PaymentMoneyStatusTooltip.vue'

const emit = defineEmits<{ (e: 'success'): void }>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission, organization } = MeService

const showModal = ref(false)
const dataLoading = ref(false)
const ticket = ref(Ticket.blank())

const ticketRegimenPayment = ref<TicketRegimen[]>([])
const ticketProcedureNormalPayment = ref<TicketProcedure[]>([])
const ticketConsumablePayment = ref<TicketProduct[]>([])
const ticketPrescriptionPayment = ref<TicketProduct[]>([])
const ticketLaboratoryPayment = ref<TicketLaboratory[]>([])
const ticketRadiologyPayment = ref<TicketRadiology[]>([])

const paymentMethodId = ref<number>(0)
const note = ref('')
const paymentMethodOptions = ref<{ value: any; label: string }[]>([])
const pickAll = ref(false)

const checkboxRegimen = ref<
  Record<
    string, // trId
    {
      checked: boolean
      indeterminate: boolean
      data: TicketRegimen
      paymentWallet: number
      paymentItem: number
      typeAction: 'PaymentWallet' | 'CheckItem' | ''
      trpCheckbox: Record<
        string, // trpId
        { data: TicketProcedure; checked: boolean }
      >
    }
  >
>({})

const checkboxProcedure = ref<Record<string, TicketProcedure | undefined>>({})
const checkboxPrescription = ref<Record<string, TicketProduct | undefined>>({})
const checkboxConsumable = ref<Record<string, TicketProduct | undefined>>({})
const checkboxLaboratory = ref<Record<string, TicketLaboratory | undefined>>({})
const checkboxRadiology = ref<Record<string, TicketRadiology | undefined>>({})

onMounted(async () => {
  const paymentMethodAll = await PaymentMethodService.list({ sort: { priority: 'ASC' } })
  paymentMethodOptions.value = paymentMethodAll.map((i) => ({ value: i.id, label: i.name }))
  paymentMethodId.value = paymentMethodAll[0]?.id || 0
})

const totalMoney = computed(() => {
  const regimenMoney = Object.values(checkboxRegimen.value).reduce((acc, item) => {
    return acc + item.paymentWallet + item.paymentItem
  }, 0)
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

  ticketRegimenPayment.value = (ticket.value.ticketRegimenList || []).filter((i) => {
    return i.moneyAmountPaid !== i.actualPrice
  })
  ticketProcedureNormalPayment.value = (ticket.value.ticketProcedureNormalList || []).filter(
    (i) => {
      return i.paymentMoneyStatus === PaymentMoneyStatus.PendingPayment
    },
  )
  ticketConsumablePayment.value = (ticket.value.ticketProductConsumableList || []).filter((i) => {
    return i.paymentMoneyStatus === PaymentMoneyStatus.PendingPayment
  })
  ticketPrescriptionPayment.value = (ticket.value.ticketProductPrescriptionList || []).filter(
    (i) => {
      return i.paymentMoneyStatus === PaymentMoneyStatus.PendingPayment
    },
  )
  ticketLaboratoryPayment.value = (ticket.value.ticketLaboratoryList || []).filter((i) => {
    return i.paymentMoneyStatus === PaymentMoneyStatus.PendingPayment
  })
  ticketRadiologyPayment.value = (ticket.value.ticketRadiologyList || []).filter((i) => {
    return i.paymentMoneyStatus === PaymentMoneyStatus.PendingPayment
  })

  checkboxRegimen.value = {}
  checkboxProcedure.value = {}
  checkboxPrescription.value = {}
  checkboxConsumable.value = {}
  checkboxLaboratory.value = {}
  checkboxRadiology.value = {}

  ticketRegimenPayment.value?.forEach((tr) => {
    checkboxRegimen.value[tr.id] = {
      checked: false,
      indeterminate: false,
      typeAction: tr.moneyAmountWallet ? 'PaymentWallet' : '',
      paymentWallet: 0,
      paymentItem: 0,
      data: tr,
      trpCheckbox: {},
    }
    tr.ticketProcedureList?.forEach((trp) => {
      checkboxRegimen.value[tr.id].trpCheckbox[trp.id] = { checked: false, data: trp }
    })
  })

  note.value = ''
  paymentMethodId.value = 0
  pickAll.value = false
}

const openModal = async (options: { ticketId: string; customer: Customer }) => {
  showModal.value = true
  const { ticketId } = options
  try {
    dataLoading.value = true
    ticket.value = await TicketService.detail(ticketId, {
      relation: {
        ticketRegimenList: true,
        ticketRegimenItemList: true,
        ticketProcedureList: true,
        ticketProductList: { batch: true, product: true },
        ticketLaboratoryList: true,
        ticketRadiologyList: true,
      },
    })
    ticket.value.customer = Customer.from(options.customer)
    await refreshData()
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
    ticketProcedureNormalPayment.value.forEach((i) => {
      checkboxProcedure.value[i.id] = i
    })
    ticketConsumablePayment.value?.forEach((i) => {
      checkboxConsumable.value[i.id] = i
    })
    ticketPrescriptionPayment.value?.forEach((i) => {
      checkboxPrescription.value[i.id] = i
    })

    ticketLaboratoryPayment.value?.forEach((i) => {
      checkboxLaboratory.value[i.id] = i
    })
    ticketRadiologyPayment.value?.forEach((i) => {
      checkboxRadiology.value[i.id] = i
    })
    ticketRegimenPayment.value?.forEach((tr) => {
      handleUpdateCheckedTicketRegimen(true, tr)
    })
  } else {
    ticketRegimenPayment.value?.forEach((tr) => {
      handleUpdateCheckedTicketRegimen(false, tr)
    })
  }
}

const startPrepayment = async (options?: { print: boolean }) => {
  try {
    const { paymentCreated } = await TicketMoneyApi.prepaymentTicketItemList({
      ticketId: ticket.value.id,
      body: {
        customerId: ticket.value.customerId,
        paymentMethodId: paymentMethodId.value,
        note: note.value,
        paidAmount: totalMoney.value,
        ticketRegimenBodyList: Object.values(checkboxRegimen.value)
          .filter((v) => v.typeAction === 'PaymentWallet' && v.paymentWallet !== 0)
          .map((value) => {
            const ticketRegimen = value.data
            if (value.paymentWallet === ticketRegimen.actualPrice) {
              return {
                ticketItemId: ticketRegimen.id,
                ticketItemType: TicketItemType.TicketRegimen,
                interactId: ticketRegimen.regimenId,
                expectedPrice: ticketRegimen.expectedPrice,
                discountMoney: ticketRegimen.discountMoney,
                discountPercent: ticketRegimen.discountPercent,
                discountType: ticketRegimen.discountType,
                actualPrice: ticketRegimen.actualPrice,
                quantity: 1,
                sessionIndex: 0,
                paymentMoneyStatus: PaymentMoneyStatus.PendingPayment, // để tạm để validate chứ không sử dụng
              }
            } else {
              return {
                ticketItemId: ticketRegimen.id,
                ticketItemType: TicketItemType.TicketRegimen,
                interactId: ticketRegimen.regimenId,
                expectedPrice: value.paymentWallet,
                discountMoney: 0,
                discountPercent: 0,
                discountType: DiscountType.VND,
                actualPrice: value.paymentWallet,
                quantity: 1,
                sessionIndex: 0,
                paymentMoneyStatus: PaymentMoneyStatus.PendingPayment, // để tạm để validate chứ không sử dụng
              }
            }
          }),
        ticketProcedureBodyList: [
          ...Object.values(checkboxRegimen.value)
            .filter((v) => v.typeAction === 'CheckItem' && v.paymentItem !== 0)
            .map((value) => {
              const trpCheckbox = value.trpCheckbox
              return Object.values(trpCheckbox)
                .filter((tpV) => tpV.checked)
                .map((tpV) => {
                  const tp = tpV.data
                  return {
                    ticketItemId: tp.id,
                    ticketItemType: TicketItemType.TicketProcedure,
                    interactId: tp.procedureId,
                    expectedPrice: tp.expectedPrice,
                    discountMoney: tp.discountMoney,
                    discountPercent: tp.discountPercent,
                    discountType: tp.discountType,
                    actualPrice: tp.actualPrice,
                    quantity: tp.quantity,
                    sessionIndex: tp.indexSession,
                    paymentMoneyStatus: tp.paymentMoneyStatus,
                  }
                })
            })
            .flat(),
          ...Object.entries(checkboxProcedure.value)
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
        ],
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

const startPrint = async () => {
  try {
    const paymentTemp = Payment.blank()
    paymentTemp.voucherType = PaymentVoucherType.Ticket
    paymentTemp.voucherId = ticket.value.id
    paymentTemp.personType = PaymentPersonType.Customer
    paymentTemp.personId = ticket.value.customerId
    paymentTemp.paymentActionType = PaymentActionType.PrepaymentForTicketItemList

    paymentTemp.createdAt = Date.now()
    paymentTemp.moneyDirection = MoneyDirection.In
    paymentTemp.cashierId = MeService.user.value!.id
    paymentTemp.note = note.value
    paymentTemp.paymentMethodId = paymentMethodId.value

    paymentTemp.paidAmount = totalMoney.value

    const paymentTicketItemRegimen: PaymentTicketItem[] = Object.entries(checkboxRegimen.value)
      .filter(([id, value]) => {
        return !!value && value.typeAction === 'PaymentWallet' && value.paymentWallet != 0
      })
      .map(([id, value]) => {
        const paymentTicketItem = PaymentTicketItem.blank()
        paymentTicketItem.ticketItemType = TicketItemType.TicketRegimen
        paymentTicketItem.ticketItemId = value!.data.id
        paymentTicketItem.interactId = value!.data.regimenId

        if (value.paymentWallet === value.data.actualPrice) {
          paymentTicketItem.expectedPrice = value!.data.expectedPrice
          paymentTicketItem.discountMoney = value!.data.discountMoney
          paymentTicketItem.discountPercent = value!.data.discountPercent
          paymentTicketItem.discountType = value!.data.discountType
          paymentTicketItem.actualPrice = value!.data.actualPrice
          paymentTicketItem.quantity = 1
        } else {
          paymentTicketItem.expectedPrice = value!.paymentWallet
          paymentTicketItem.discountMoney = 0
          paymentTicketItem.discountPercent = 0
          paymentTicketItem.discountType = DiscountType.VND
          paymentTicketItem.actualPrice = value!.paymentWallet
          paymentTicketItem.quantity = 1
        }

        return paymentTicketItem
      })

    const paymentTicketItemProcedureRegimen: PaymentTicketItem[] = Object.entries(
      checkboxRegimen.value,
    )
      .filter(([id, value]) => {
        return !!value && value.typeAction === 'CheckItem' && value.paymentItem != 0
      })
      .map(([id, value]) => {
        const trpCheckbox = value.trpCheckbox
        return Object.values(trpCheckbox)
          .filter((tpV) => tpV.checked)
          .map((tpV) => {
            const tp = tpV.data

            const paymentTicketItem = PaymentTicketItem.blank()
            paymentTicketItem.ticketItemType = TicketItemType.TicketProcedure
            paymentTicketItem.ticketItemId = tp.id
            paymentTicketItem.interactId = tp.procedureId

            paymentTicketItem.expectedPrice = tp!.expectedPrice
            paymentTicketItem.discountMoney = tp!.discountMoney
            paymentTicketItem.discountPercent = tp!.discountPercent
            paymentTicketItem.discountType = tp!.discountType
            paymentTicketItem.actualPrice = tp!.actualPrice
            paymentTicketItem.quantity = tp!.quantity
            return paymentTicketItem
          })
      })
      .flat()

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
        paymentTicketItem.actualPrice = value!.actualPrice
        paymentTicketItem.quantity = value!.quantity
        paymentTicketItem.discountMoney = value!.discountMoney
        paymentTicketItem.discountPercent = value!.discountPercent
        paymentTicketItem.discountType = value!.discountType
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
      ...paymentTicketItemProcedureRegimen,
      ...paymentTicketItemProcedure,
      ...paymentTicketItemConsumable,
      ...paymentTicketItemPrescription,
      ...paymentTicketItemLaboratory,
      ...paymentTicketItemRadiology,
    ]

    const paymentPrint = await Payment.refreshData(paymentTemp)
    console.log('🚀 ~ ModalPrepaymentTicketItem.vue:575 ~ startPrint ~ paymentPrint:', paymentPrint)
    await PrintHtmlAction.startPrintCustomerPayment({
      customer: ticket.value.customer!,
      payment: paymentPrint,
    })
  } catch (error) {
    console.log('🚀 ~ ModalPrepaymentTicketItem.vue:380 ~ startPrint ~ error:', error)
  }
}

const disabledButtonSave = computed(() => {
  if (totalMoney.value === 0) {
    return true
  }
  return false
})

const handleUpdateCheckedTicketRegimen = (checked: boolean, tr: TicketRegimen) => {
  checkboxRegimen.value[tr.id].indeterminate = false
  if (checked) {
    checkboxRegimen.value[tr.id].checked = true
    if (tr.moneyAmountWallet) {
      checkboxRegimen.value[tr.id].typeAction = 'PaymentWallet'
      checkboxRegimen.value[tr.id].paymentItem = 0
      checkboxRegimen.value[tr.id].paymentWallet =
        tr.actualPrice - (tr.moneyAmountPaid + tr.moneyAmountWallet)
      tr.ticketProcedureList?.forEach((trp) => {
        if (trp.paymentMoneyStatus !== PaymentMoneyStatus.FullPaid) {
          checkboxRegimen.value[tr.id].trpCheckbox[trp.id].checked = false
        }
      })
    } else {
      checkboxRegimen.value[tr.id].typeAction = 'CheckItem'
      checkboxRegimen.value[tr.id].paymentWallet = 0
      checkboxRegimen.value[tr.id].paymentItem =
        tr.actualPrice - (tr.moneyAmountPaid + tr.moneyAmountWallet)
      tr.ticketProcedureList?.forEach((trp) => {
        if (trp.paymentMoneyStatus !== PaymentMoneyStatus.FullPaid) {
          checkboxRegimen.value[tr.id].trpCheckbox[trp.id].checked = true
        }
      })
    }
  } else {
    checkboxRegimen.value[tr.id].checked = false
    checkboxRegimen.value[tr.id].paymentWallet = 0
    checkboxRegimen.value[tr.id].paymentItem = 0
    checkboxRegimen.value[tr.id].typeAction = tr.moneyAmountWallet ? 'PaymentWallet' : ''
    tr.ticketProcedureList?.forEach((trp) => {
      checkboxRegimen.value[tr.id].trpCheckbox[trp.id].checked = false
    })
  }
}

const handleUpdateCheckedTicketRegimenProcedure = (checked: boolean, trp: TicketProcedure) => {
  if (checked) {
    checkboxRegimen.value[trp.ticketRegimenId].paymentItem += trp.quantity * trp.actualPrice
  } else {
    checkboxRegimen.value[trp.ticketRegimenId].paymentItem -= trp.quantity * trp.actualPrice
  }
  checkboxRegimen.value[trp.ticketRegimenId].paymentWallet = 0

  if (checkboxRegimen.value[trp.ticketRegimenId].paymentItem === 0) {
    checkboxRegimen.value[trp.ticketRegimenId].typeAction = ''
    checkboxRegimen.value[trp.ticketRegimenId].indeterminate = false
    checkboxRegimen.value[trp.ticketRegimenId].checked = false
  } else if (
    checkboxRegimen.value[trp.ticketRegimenId].paymentItem ===
    checkboxRegimen.value[trp.ticketRegimenId].data.actualPrice -
      (checkboxRegimen.value[trp.ticketRegimenId].data.moneyAmountPaid +
        checkboxRegimen.value[trp.ticketRegimenId].data.moneyAmountWallet)
  ) {
    checkboxRegimen.value[trp.ticketRegimenId].typeAction = 'CheckItem'
    checkboxRegimen.value[trp.ticketRegimenId].indeterminate = false
    checkboxRegimen.value[trp.ticketRegimenId].checked = true
  } else {
    checkboxRegimen.value[trp.ticketRegimenId].typeAction = 'CheckItem'
    checkboxRegimen.value[trp.ticketRegimenId].indeterminate = true
    checkboxRegimen.value[trp.ticketRegimenId].checked = false
  }
}

const handleUpdateMoneyTicketRegimen = (money: number, tr: TicketRegimen) => {
  checkboxRegimen.value[tr.id].paymentWallet = money
  checkboxRegimen.value[tr.id].paymentItem = 0
  if (money <= 0) {
    checkboxRegimen.value[tr.id].checked = false
    checkboxRegimen.value[tr.id].indeterminate = false
    checkboxRegimen.value[tr.id].typeAction = ''
  } else if (money < tr.actualPrice - tr.moneyAmountPaid) {
    checkboxRegimen.value[tr.id].checked = false
    checkboxRegimen.value[tr.id].indeterminate = true
    checkboxRegimen.value[tr.id].typeAction = 'PaymentWallet'
  } else if (money === tr.actualPrice - tr.moneyAmountPaid) {
    checkboxRegimen.value[tr.id].checked = true
    checkboxRegimen.value[tr.id].indeterminate = false
    checkboxRegimen.value[tr.id].typeAction = 'PaymentWallet'
  } else {
    checkboxRegimen.value[tr.id].checked = false
    checkboxRegimen.value[tr.id].indeterminate = false
    checkboxRegimen.value[tr.id].typeAction = 'PaymentWallet'
  }
}

defineExpose({ openModal, openModalByTicket })
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
            <tbody>
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
          <table v-else>
            <tbody
              v-if="
                !ticketRegimenPayment.length &&
                !ticketProcedureNormalPayment.length &&
                !ticketConsumablePayment?.length &&
                !ticketPrescriptionPayment?.length &&
                !ticketLaboratoryPayment?.length &&
                !ticketRadiologyPayment?.length
              "
            >
              <tr>
                <td colspan="100" class="text-center">Không có dịch vụ nào cần thanh toán</td>
              </tr>
            </tbody>
            <template v-if="ticketRegimenPayment.length">
              <thead>
                <tr>
                  <th style="width: 40px">Chọn</th>
                  <th>#</th>
                  <th></th>
                  <th>Liệu trình</th>
                  <th></th>
                  <th>Đơn Giá</th>
                  <th>Thanh toán</th>
                </tr>
              </thead>
              <tbody>
                <template
                  v-for="(ticketRegimen, index) in ticket.ticketRegimenList"
                  :key="ticketRegimen.id"
                >
                  <tr>
                    <td>
                      <div class="flex justify-center">
                        <InputCheckbox
                          :checked="checkboxRegimen[ticketRegimen.id].checked"
                          :indeterminate="checkboxRegimen[ticketRegimen.id].indeterminate"
                          @update:checked="
                            (checked) => handleUpdateCheckedTicketRegimen(checked, ticketRegimen)
                          "
                        />
                      </div>
                    </td>
                    <td class="text-center">{{ index + 1 }}</td>
                    <td colspan="4">
                      <div class="flex justify-between items-center">
                        <div class="flex gap-1 flex-wrap">
                          <div>{{ ticketRegimen.regimen?.name }}</div>
                          <div
                            v-if="ticketRegimen.moneyAmountWallet"
                            style="font-size: 0.8em; font-style: italic; color: #555"
                          >
                            (Bắt buộc chuyển sang hình thức thanh toán vào Ví do trong Ví đang có
                            tiền)
                          </div>
                        </div>
                        <div>
                          <table>
                            <tbody>
                              <tr>
                                <td style="white-space: nowrap">Giá tiền:</td>
                                <td class="text-right font-bold pl-4">
                                  {{ formatMoney(ticketRegimen.actualPrice) }}
                                </td>
                              </tr>
                              <tr>
                                <td style="white-space: nowrap">Đã sử dụng:</td>
                                <td
                                  class="text-right font-bold pl-4"
                                  style="color: var(--text-green)"
                                >
                                  {{ formatMoney(ticketRegimen.moneyAmountPaid) }}
                                </td>
                              </tr>
                              <tr v-if="ticketRegimen.moneyAmountWallet">
                                <td>Ví:</td>
                                <td class="text-right font-bold pl-4" style="color: violet">
                                  {{ formatMoney(ticketRegimen.moneyAmountWallet) }}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                    <td style="max-width: 100px">
                      <div v-if="checkboxRegimen[ticketRegimen.id].typeAction === 'CheckItem'">
                        <InputNumber
                          :value="checkboxRegimen[ticketRegimen.id].paymentItem"
                          disabled
                          textAlign="right"
                        />
                      </div>
                      <div v-else>
                        <div
                          style="
                            white-space: nowrap;
                            font-size: 1em;
                            font-style: italic;
                            color: #555;
                            text-align: right;
                          "
                        >
                          TT vào Ví
                        </div>
                        <InputNumber
                          :value="checkboxRegimen[ticketRegimen.id].paymentWallet"
                          @update:value="(v) => handleUpdateMoneyTicketRegimen(v, ticketRegimen)"
                          textAlign="right"
                        />
                      </div>
                    </td>
                  </tr>
                  <template v-for="trp in ticketRegimen.ticketProcedureList" :key="trp.id">
                    <tr>
                      <td></td>
                      <td>
                        <div class="flex justify-center">
                          <InputCheckbox
                            v-if="trp.paymentMoneyStatus !== PaymentMoneyStatus.FullPaid"
                            :disabled="
                              checkboxRegimen[ticketRegimen.id].typeAction === 'PaymentWallet'
                            "
                            v-model:checked="
                              checkboxRegimen[ticketRegimen.id].trpCheckbox[trp.id].checked
                            "
                            @update:checked="
                              (checked) => handleUpdateCheckedTicketRegimenProcedure(checked, trp)
                            "
                          />
                        </div>
                      </td>
                      <td>
                        <PaymentMoneyStatusTooltip :paymentMoneyStatus="trp.paymentMoneyStatus" />
                      </td>
                      <td colspan="2">
                        <div class="flex gap-1">
                          <span>{{ trp.procedure?.name }}</span>
                          <span style="font-weight: 700">( buổi {{ trp.indexSession }} )</span>
                        </div>
                      </td>
                      <td class="text-right whitespace-nowrap">
                        <div v-if="trp.discountMoney" class="text-xs italic text-red-500">
                          <del>
                            {{ formatMoney(Math.round(trp.expectedPrice)) }}
                          </del>
                        </div>
                        <div>
                          {{ formatMoney(Math.round(trp.actualPrice)) }}
                        </div>
                      </td>
                      <td class="text-center"></td>
                    </tr>
                  </template>
                </template>
              </tbody>
            </template>
            <template v-if="ticketProcedureNormalPayment?.length">
              <thead>
                <tr>
                  <th>Chọn</th>
                  <th>#</th>
                  <th></th>
                  <th>
                    <span>Dịch vụ</span>
                  </th>
                  <th>SL</th>
                  <th>Đơn giá</th>
                  <th>Thanh toán</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(ticketProcedure, index) in ticket.ticketProcedureNormalList"
                  :key="ticketProcedure.id"
                >
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
            <template v-if="ticketConsumablePayment?.length">
              <thead>
                <tr>
                  <th>Chọn</th>
                  <th>#</th>
                  <th></th>
                  <th>
                    <span>Vật tư</span>
                  </th>
                  <th>SL</th>
                  <th>Đơn giá</th>
                  <th>Thanh toán</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(ticketConsumable, index) in ticket.ticketProductConsumableList"
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
            <template v-if="ticketPrescriptionPayment?.length">
              <thead>
                <tr>
                  <th>Chọn</th>
                  <th>#</th>
                  <th></th>
                  <th>
                    <span>Thuốc</span>
                  </th>
                  <th>SL</th>
                  <th>Đơn giá</th>
                  <th>Thanh toán</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(ticketPrescription, index) in ticket.ticketProductPrescriptionList"
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
            <template v-if="ticketLaboratoryPayment?.length">
              <thead>
                <tr>
                  <th>Chọn</th>
                  <th>#</th>
                  <th></th>
                  <th>
                    <span>Xét nghiệm</span>
                  </th>
                  <th></th>
                  <th></th>
                  <th>Thanh toán</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(ticketLaboratory, index) in ticket.ticketLaboratoryList"
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
            <template v-if="ticketRadiologyPayment?.length">
              <thead>
                <tr>
                  <th>Chọn</th>
                  <th>#</th>
                  <th></th>
                  <th>
                    <span>Phiếu CĐHA</span>
                  </th>
                  <th></th>
                  <th></th>
                  <th>Thanh toán</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(ticketRadiology, index) in ticketRadiologyPayment"
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
          @click="startPrint"
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
