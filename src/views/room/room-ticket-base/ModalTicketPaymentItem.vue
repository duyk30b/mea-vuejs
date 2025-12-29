<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconBug, IconClose } from '@/common/icon-antd'
import { VueTooltip } from '@/common/popover'
import { InputCheckbox, InputMoney, InputNumber, InputText } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Customer } from '@/modules/customer'
import { PaymentMoneyStatus } from '@/modules/enum'
import {
  MoneyDirection,
  Payment,
  PaymentActionType,
  PaymentPersonType,
  PaymentVoucherType,
} from '@/modules/payment'
import { PaymentTicketItem, TicketItemType } from '@/modules/payment-ticket-item'
import { PrintHtmlAction } from '@/modules/print-html'
import { ticketRoomRef } from '@/modules/room'
import { Ticket, TicketMoneyApi, TicketService, type PaymentTicketItemBody } from '@/modules/ticket'
import type { TicketLaboratory } from '@/modules/ticket-laboratory'
import type { TicketProcedure } from '@/modules/ticket-procedure'
import type { TicketProduct } from '@/modules/ticket-product'
import type { TicketRadiology } from '@/modules/ticket-radiology'
import type { TicketRegimen } from '@/modules/ticket-regimen'
import { WalletService } from '@/modules/wallet'
import InputSelectWallet from '@/views/component/InputSelectWallet.vue'
import PaymentMoneyStatusTooltip from '@/views/finance/payment/PaymentMoneyStatusTooltip.vue'
import { computed, ref } from 'vue'

const emit = defineEmits<{ (e: 'success'): void }>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission, organization } = MeService

const paymentActionType = ref(PaymentActionType.PaymentMoney)
const showModal = ref(false)
const dataLoading = ref(false)
const ticket = ref(Ticket.blank())

const walletId = ref<string>('')
const note = ref('')
const pickAll = ref(false)

const ticketRegimenAction = ref<
  Record<
    string, // trId
    {
      checked: boolean
      indeterminate: boolean
      data: TicketRegimen
      paidMoney: number
      debtMoney: number
      paidItemMoney: number
      debtItemMoney: number
      trpCheckbox: Record<
        string, // trpId
        { data: TicketProcedure; checked: boolean; paidMoney: number; debtMoney: number }
      >
    }
  >
>({})

const ticketProcedureNormalAction = ref<
  Record<string, { data: TicketProcedure; checked: boolean; paidMoney: number; debtMoney: number }>
>({})
const ticketPrescriptionAction = ref<
  Record<string, { data: TicketProduct; checked: boolean; paidMoney: number; debtMoney: number }>
>({})
const ticketConsumableAction = ref<
  Record<string, { data: TicketProduct; checked: boolean; paidMoney: number; debtMoney: number }>
>({})
const ticketLaboratoryAction = ref<
  Record<string, { data: TicketLaboratory; checked: boolean; paidMoney: number; debtMoney: number }>
>({})
const ticketRadiologyAction = ref<
  Record<string, { data: TicketRadiology; checked: boolean; paidMoney: number; debtMoney: number }>
>({})

const paidWait = ref(0)
const paidSurchargeAction = ref({ checked: false, paidMoney: 0, debtMoney: 0 })
const paidDiscountAction = ref({ checked: false, paidMoney: 0, debtMoney: 0 })

const paidItemMoney = computed(() => {
  const regimenMoney = Object.values(ticketRegimenAction.value).reduce((acc, item) => {
    return acc + item.paidMoney + item.paidItemMoney
  }, 0)
  const procedureNormalMoney = Object.entries(ticketProcedureNormalAction.value)
    .filter(([id, value]) => !!value && value.checked)
    .reduce((acc, [id, value]) => acc + value.paidMoney, 0)
  const prescriptionMoney = Object.entries(ticketPrescriptionAction.value)
    .filter(([id, value]) => !!value && value.checked)
    .reduce((acc, [id, value]) => acc + value.paidMoney, 0)
  const consumableMoney = Object.entries(ticketConsumableAction.value)
    .filter(([id, value]) => !!value && value.checked)
    .reduce((acc, [id, value]) => acc + value.paidMoney, 0)
  const laboratoryMoney = Object.entries(ticketLaboratoryAction.value)
    .filter(([id, value]) => !!value && value.checked)
    .reduce((acc, [id, value]) => acc + value.paidMoney, 0)
  const radiologyMoney = Object.entries(ticketRadiologyAction.value)
    .filter(([id, value]) => !!value && value.checked)
    .reduce((acc, [id, value]) => acc + value.paidMoney, 0)
  return (
    regimenMoney +
    procedureNormalMoney +
    prescriptionMoney +
    consumableMoney +
    laboratoryMoney +
    radiologyMoney
  )
})

const debtItemMoney = computed(() => {
  const regimenMoney = Object.values(ticketRegimenAction.value).reduce((acc, item) => {
    return acc + item.debtMoney + item.debtItemMoney
  }, 0)
  const procedureNormalMoney = Object.entries(ticketProcedureNormalAction.value)
    .filter(([id, value]) => !!value && value.checked)
    .reduce((acc, [id, value]) => acc + value.debtMoney, 0)
  const prescriptionMoney = Object.entries(ticketPrescriptionAction.value)
    .filter(([id, value]) => !!value && value.checked)
    .reduce((acc, [id, value]) => acc + value.debtMoney, 0)
  const consumableMoney = Object.entries(ticketConsumableAction.value)
    .filter(([id, value]) => !!value && value.checked)
    .reduce((acc, [id, value]) => acc + value.debtMoney, 0)
  const laboratoryMoney = Object.entries(ticketLaboratoryAction.value)
    .filter(([id, value]) => !!value && value.checked)
    .reduce((acc, [id, value]) => acc + value.debtMoney, 0)
  const radiologyMoney = Object.entries(ticketRadiologyAction.value)
    .filter(([id, value]) => !!value && value.checked)
    .reduce((acc, [id, value]) => acc + value.debtMoney, 0)
  return (
    regimenMoney +
    procedureNormalMoney +
    prescriptionMoney +
    consumableMoney +
    laboratoryMoney +
    radiologyMoney
  )
})

const paidTotal = computed(() => {
  const surchargeMoney = paidSurchargeAction.value.checked ? paidSurchargeAction.value.paidMoney : 0
  const discountMoney = paidDiscountAction.value.checked ? paidDiscountAction.value.paidMoney : 0
  return paidWait.value + surchargeMoney + discountMoney + paidItemMoney.value
})

const debtTotal = computed(() => {
  const surchargeMoney = paidSurchargeAction.value.checked ? paidSurchargeAction.value.debtMoney : 0
  const discountMoney = paidDiscountAction.value.checked ? paidDiscountAction.value.debtMoney : 0
  return surchargeMoney + discountMoney + debtItemMoney.value
})

const refreshData = async () => {
  await ticket.value.refreshAllData()

  paidSurchargeAction.value = { checked: false, paidMoney: 0, debtMoney: 0 }
  paidDiscountAction.value = { checked: false, paidMoney: 0, debtMoney: 0 }

  if (paymentActionType.value === PaymentActionType.PaymentMoney) {
    paidSurchargeAction.value.paidMoney =
      ticket.value.surcharge - ticket.value.ticketPaymentDetail.paidSurcharge
    paidSurchargeAction.value.debtMoney = -Math.min(
      paidSurchargeAction.value.paidMoney,
      ticket.value.ticketPaymentDetail.debtSurcharge,
    )
    // do discountMoney là số âm
    paidDiscountAction.value.paidMoney =
      -ticket.value.discountMoney - ticket.value.ticketPaymentDetail.paidDiscount
    paidDiscountAction.value.debtMoney = -Math.max(
      paidDiscountAction.value.paidMoney,
      ticket.value.ticketPaymentDetail.debtDiscount,
    )
  } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
    paidSurchargeAction.value.paidMoney = -ticket.value.ticketPaymentDetail.paidSurcharge
    paidDiscountAction.value.paidMoney = -ticket.value.ticketPaymentDetail.paidDiscount

    paidSurchargeAction.value.debtMoney = -ticket.value.ticketPaymentDetail.debtSurcharge
    paidDiscountAction.value.debtMoney = -ticket.value.ticketPaymentDetail.debtDiscount
  } else if (paymentActionType.value === PaymentActionType.Debit) {
    paidSurchargeAction.value.debtMoney =
      ticket.value.surcharge -
      ticket.value.ticketPaymentDetail.paidSurcharge -
      ticket.value.ticketPaymentDetail.debtSurcharge
    // thêm dấu trừ do discountMoney lẽ ra phải là âm
    paidDiscountAction.value.debtMoney =
      -ticket.value.discountMoney -
      ticket.value.ticketPaymentDetail.paidDiscount -
      ticket.value.ticketPaymentDetail.debtDiscount
  }

  ticketRegimenAction.value = {}
  ticketProcedureNormalAction.value = {}
  ticketPrescriptionAction.value = {}
  ticketConsumableAction.value = {}
  ticketLaboratoryAction.value = {}
  ticketRadiologyAction.value = {}

  const ticketRegimenPayment = (ticket.value.ticketRegimenList || [])
    .filter((i) => {
      return true // Tạm thời cho hiện hết các liệu trình
      if (paymentActionType.value === PaymentActionType.PaymentMoney) {
        return i.paidItem !== i.actualPrice
      }
    })
    .forEach((tr) => {
      ticketRegimenAction.value[tr.id] = {
        checked: false,
        indeterminate: false,
        paidMoney: 0,
        debtMoney: 0,
        paidItemMoney: 0,
        debtItemMoney: 0,
        data: tr,
        trpCheckbox: {},
      }
      tr.ticketProcedureList?.forEach((trp) => {
        let paidMoney = 0
        let debtMoney = 0
        if (paymentActionType.value === PaymentActionType.PaymentMoney) {
          paidMoney = trp.actualPrice * trp.quantity - trp.paid
          debtMoney = Math.min(paidMoney, trp.debt)
        } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
          paidMoney = -trp.paid
          debtMoney = -trp.debt
        } else if (paymentActionType.value === PaymentActionType.Debit) {
          debtMoney = trp.actualPrice * trp.quantity - trp.paid - trp.debt
        }

        if (paidMoney != 0 || debtMoney != 0) {
          ticketRegimenAction.value[tr.id].trpCheckbox[trp.id] = {
            checked: false,
            data: trp,
            paidMoney,
            debtMoney,
          }
        }
      })
    })

  const ticketProcedureNormalPayment = (ticket.value.ticketProcedureNormalList || [])
    .filter((i) => {
      if (paymentActionType.value === PaymentActionType.PaymentMoney) {
        return i.paid < i.actualPrice * i.quantity
      } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
        return !!i.paid
      } else if (paymentActionType.value === PaymentActionType.Debit) {
        return i.paid < i.actualPrice * i.quantity - i.debt
      }
    })
    .forEach((i) => {
      let paidMoney = 0
      let debtMoney = 0
      if (paymentActionType.value === PaymentActionType.PaymentMoney) {
        paidMoney = i.actualPrice * i.quantity - i.paid
        debtMoney = Math.min(paidMoney, i.debt)
      } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
        paidMoney = -i.paid
        debtMoney = -i.debt
      } else if (paymentActionType.value === PaymentActionType.Debit) {
        debtMoney = i.actualPrice * i.quantity - i.paid - i.debt
      }
      ticketProcedureNormalAction.value[i.id] = { checked: false, data: i, paidMoney, debtMoney }
    })

  const ticketConsumablePayment = (ticket.value.ticketProductConsumableList || [])
    .filter((i) => {
      if (paymentActionType.value === PaymentActionType.PaymentMoney) {
        return i.paid < i.actualPrice * i.quantity
      } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
        return !!i.paid
      } else if (paymentActionType.value === PaymentActionType.Debit) {
        return i.paid < i.actualPrice * i.quantity - i.debt
      }
    })
    .forEach((i) => {
      let paidMoney = 0
      let debtMoney = 0
      if (paymentActionType.value === PaymentActionType.PaymentMoney) {
        paidMoney = i.actualPrice * i.quantity - i.paid
        debtMoney = Math.min(paidMoney, i.debt)
      } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
        paidMoney = -i.paid
        debtMoney = -i.debt
      } else if (paymentActionType.value === PaymentActionType.Debit) {
        debtMoney = i.actualPrice * i.quantity - i.paid - i.debt
      }
      ticketConsumableAction.value[i.id] = { checked: false, data: i, paidMoney, debtMoney }
    })

  const ticketPrescriptionPayment = (ticket.value.ticketProductPrescriptionList || [])
    .filter((i) => {
      if (paymentActionType.value === PaymentActionType.PaymentMoney) {
        return i.paid < i.actualPrice * i.quantity
      } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
        return !!i.paid
      } else if (paymentActionType.value === PaymentActionType.Debit) {
        return i.paid < i.actualPrice * i.quantity - i.debt
      }
    })
    .forEach((i) => {
      let paidMoney = 0
      let debtMoney = 0
      if (paymentActionType.value === PaymentActionType.PaymentMoney) {
        paidMoney = i.actualPrice * i.quantity - i.paid
        debtMoney = Math.min(paidMoney, i.debt)
      } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
        paidMoney = -i.paid
        debtMoney = -i.debt
      } else if (paymentActionType.value === PaymentActionType.Debit) {
        debtMoney = i.actualPrice * i.quantity - i.paid - i.debt
      }
      ticketPrescriptionAction.value[i.id] = { checked: false, data: i, paidMoney, debtMoney }
    })

  const ticketLaboratoryPayment = (ticket.value.ticketLaboratoryList || [])
    .filter((i) => {
      if (paymentActionType.value === PaymentActionType.PaymentMoney) {
        return i.paid < i.actualPrice
      } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
        return !!i.paid
      } else if (paymentActionType.value === PaymentActionType.Debit) {
        return i.paid < i.actualPrice - i.debt
      }
    })
    .forEach((i) => {
      let paidMoney = 0
      let debtMoney = 0
      if (paymentActionType.value === PaymentActionType.PaymentMoney) {
        paidMoney = i.actualPrice - i.paid
        debtMoney = Math.min(paidMoney, i.debt)
      } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
        paidMoney = -i.paid
        debtMoney = -i.debt
      } else if (paymentActionType.value === PaymentActionType.Debit) {
        debtMoney = i.actualPrice - i.paid - i.debt
      }
      ticketLaboratoryAction.value[i.id] = { checked: false, data: i, paidMoney, debtMoney }
    })

  const ticketRadiologyPayment = (ticket.value.ticketRadiologyList || [])
    .filter((i) => {
      if (paymentActionType.value === PaymentActionType.PaymentMoney) {
        return i.paid < i.actualPrice
      } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
        return !!i.paid
      } else if (paymentActionType.value === PaymentActionType.Debit) {
        return i.paid < i.actualPrice - i.debt
      }
    })
    .forEach((i) => {
      let paidMoney = 0
      let debtMoney = 0
      if (paymentActionType.value === PaymentActionType.PaymentMoney) {
        paidMoney = i.actualPrice - i.paid
        debtMoney = Math.min(paidMoney, i.debt)
      } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
        paidMoney = -i.paid
        debtMoney = -i.debt
      } else if (paymentActionType.value === PaymentActionType.Debit) {
        debtMoney = i.actualPrice - i.paid - i.debt
      }
      ticketRadiologyAction.value[i.id] = { checked: false, data: i, paidMoney, debtMoney }
    })

  note.value = ''
  pickAll.value = false
}

const openModal = async (props: {
  ticketId: string
  customer: Customer
  paymentActionType: PaymentActionType
}) => {
  showModal.value = true
  const { ticketId } = props
  paidWait.value = 0
  note.value = ''
  paymentActionType.value = props.paymentActionType
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
    ticket.value.customer = Customer.from(props.customer)
    await refreshData()
  } catch (error) {
    console.log('🚀 ~ ModalTicketClinicPayment.vue:67 ~ openModal ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

const openModalByTicket = async (props: {
  ticket: Ticket
  paymentActionType: PaymentActionType
}) => {
  ticket.value = Ticket.from(props.ticket)
  paymentActionType.value = props.paymentActionType
  showModal.value = true
  await refreshData()
}

const closeModal = () => {
  showModal.value = false
  paidWait.value = 0
  paidSurchargeAction.value = { checked: false, paidMoney: 0, debtMoney: 0 }
  paidDiscountAction.value = { checked: false, paidMoney: 0, debtMoney: 0 }
  note.value = ''
  walletId.value = ''
  ticket.value = Ticket.blank()
  pickAll.value = false

  ticketRegimenAction.value = {}
  ticketProcedureNormalAction.value = {}
  ticketPrescriptionAction.value = {}
  ticketConsumableAction.value = {}
  ticketLaboratoryAction.value = {}
  ticketRadiologyAction.value = {}
}

const startPickAll = (checked: boolean) => {
  if (!checked) {
    paidWait.value = 0
  }
  if (checked) {
    if (paymentActionType.value === PaymentActionType.RefundMoney) {
      paidWait.value = -ticket.value.ticketPaymentDetail.paidWait
    }
  }
  paidSurchargeAction.value.checked = checked
  paidDiscountAction.value.checked = checked
  Object.values(ticketRegimenAction.value).forEach((trContainer) => {
    trContainer.checked = checked
    let paidItemMoney = 0
    let debtItemMoney = 0
    Object.values(trContainer.trpCheckbox).forEach((tpContainer) => {
      tpContainer.checked = checked
      if (checked) {
        paidItemMoney += tpContainer.paidMoney
        debtItemMoney += tpContainer.debtMoney
      }
    })
    trContainer.paidItemMoney = paidItemMoney
    trContainer.debtItemMoney = debtItemMoney
  })

  Object.values(ticketProcedureNormalAction.value).forEach((i) => {
    i.checked = checked
  })
  Object.values(ticketConsumableAction.value).forEach((i) => {
    i.checked = checked
  })
  Object.values(ticketPrescriptionAction.value).forEach((i) => {
    i.checked = checked
  })
  Object.values(ticketLaboratoryAction.value).forEach((i) => {
    i.checked = checked
  })
  Object.values(ticketRadiologyAction.value).forEach((i) => {
    i.checked = checked
  })
}

const startPaymentMoney = async (options?: { print: boolean }) => {
  try {
    const { paymentCreated } = await TicketMoneyApi.paymentMoney({
      ticketId: ticket.value.id,
      body: {
        walletId: paymentActionType.value === PaymentActionType.Debit ? '' : walletId.value,
        paymentActionType: paymentActionType.value,
        hasPaymentItem: 1,
        paidTotal: paidTotal.value,
        debtTotal: debtTotal.value,
        note: note.value,
        paymentTicketItemMapDto: {
          paymentWait: { paidMoney: paidWait.value },
          paymentSurcharge: (() => {
            let paidMoney = 0
            let debtMoney = 0
            if (paidSurchargeAction.value.checked) {
              paidMoney = paidSurchargeAction.value.paidMoney
              debtMoney = paidSurchargeAction.value.debtMoney
            }
            return { paidMoney, debtMoney }
          })(),
          paymentDiscount: (() => {
            let paidMoney = 0
            let debtMoney = 0
            if (paidDiscountAction.value.checked) {
              paidMoney = paidDiscountAction.value.paidMoney
              debtMoney = paidDiscountAction.value.debtMoney
            }
            return { paidMoney, debtMoney }
          })(),
          ticketRegimenBodyList: [],
          ticketProcedureNoEffectBodyList: Object.values(ticketRegimenAction.value)
            .filter((v) => v.paidItemMoney !== 0 || v.debtItemMoney !== 0)
            .map((value) => {
              const trpCheckbox = value.trpCheckbox
              return Object.values(trpCheckbox)
                .filter((tpContainer) => {
                  return (
                    tpContainer.checked &&
                    tpContainer.data.paymentMoneyStatus === PaymentMoneyStatus.NoEffect
                  )
                })
                .map((tpContainer) => {
                  const tp = tpContainer.data
                  const ticketPaymentItem: PaymentTicketItemBody = {
                    ticketItemType: TicketItemType.TicketProcedure,
                    ticketItemId: tp.id,
                    interactId: tp.procedureId,
                    expectedPrice: tp.expectedPrice,
                    discountMoney: tp.discountMoney,
                    discountPercent: tp.discountPercent,
                    discountType: tp.discountType,
                    actualPrice: tp.actualPrice,
                    quantity: tp.quantity,
                    sessionIndex: tp.indexSession,
                    paidMoney: tpContainer.paidMoney,
                    debtMoney: tpContainer.debtMoney,
                  }
                  return ticketPaymentItem
                })
            })
            .flat(),
          ticketProcedureHasEffectBodyList: [
            ...Object.values(ticketRegimenAction.value)
              .filter((v) => v.paidItemMoney !== 0 || v.debtItemMoney !== 0)
              .map((value) => {
                const trpCheckbox = value.trpCheckbox
                return Object.values(trpCheckbox)
                  .filter((tpContainer) => {
                    return (
                      tpContainer.checked &&
                      tpContainer.data.paymentMoneyStatus !== PaymentMoneyStatus.NoEffect
                    )
                  })
                  .map((tpContainer) => {
                    const tp = tpContainer.data
                    const ticketPaymentItem: PaymentTicketItemBody = {
                      ticketItemType: TicketItemType.TicketProcedure,
                      ticketItemId: tp.id,
                      interactId: tp.procedureId,
                      expectedPrice: tp.expectedPrice,
                      discountMoney: tp.discountMoney,
                      discountPercent: tp.discountPercent,
                      discountType: tp.discountType,
                      actualPrice: tp.actualPrice,
                      quantity: tp.quantity,
                      sessionIndex: tp.indexSession,
                      paidMoney: tpContainer.paidMoney,
                      debtMoney: tpContainer.debtMoney,
                    }
                    return ticketPaymentItem
                  })
              })
              .flat(),
            ...Object.entries(ticketProcedureNormalAction.value)
              .filter(([id, tpContainer]) => {
                return (
                  tpContainer.checked &&
                  tpContainer.data.paymentMoneyStatus !== PaymentMoneyStatus.NoEffect
                )
              })
              .map(([id, tpContainer]) => {
                const tp = tpContainer.data
                const ticketPaymentItem: PaymentTicketItemBody = {
                  ticketItemId: tp!.id,
                  ticketItemType: TicketItemType.TicketProcedure,
                  interactId: tp!.procedureId,
                  expectedPrice: tp!.expectedPrice,
                  discountMoney: tp!.discountMoney,
                  discountPercent: tp!.discountPercent,
                  discountType: tp!.discountType,
                  actualPrice: tp!.actualPrice,
                  quantity: tp!.quantity,
                  sessionIndex: tp!.indexSession,
                  paidMoney: tpContainer.paidMoney,
                  debtMoney: tpContainer.debtMoney,
                }
                return ticketPaymentItem
              }),
          ],
          ticketProductConsumableBodyList: Object.entries(ticketConsumableAction.value)
            .filter(([id, tpContainer]) => !!tpContainer && tpContainer.checked)
            .map(([id, tpContainer]) => {
              const tp = tpContainer.data
              const ticketPaymentItem: PaymentTicketItemBody = {
                ticketItemId: tp!.id,
                interactId: tp!.productId,
                ticketItemType: TicketItemType.TicketProductConsumable,
                expectedPrice: tp!.expectedPrice,
                discountMoney: tp!.discountMoney,
                discountPercent: tp!.discountPercent,
                discountType: tp!.discountType,
                actualPrice: tp!.actualPrice,
                quantity: tp!.quantity,
                sessionIndex: 0,
                paidMoney: tpContainer.paidMoney,
                debtMoney: tpContainer.debtMoney,
              }
              return ticketPaymentItem
            }),
          ticketProductPrescriptionBodyList: Object.entries(ticketPrescriptionAction.value)
            .filter(([id, tpContainer]) => !!tpContainer && tpContainer.checked)
            .map(([id, tpContainer]) => {
              const tp = tpContainer.data
              const ticketPaymentItem: PaymentTicketItemBody = {
                ticketItemId: tp!.id,
                interactId: tp!.productId,
                ticketItemType: TicketItemType.TicketProductPrescription,
                expectedPrice: tp!.expectedPrice,
                discountMoney: tp!.discountMoney,
                discountPercent: tp!.discountPercent,
                discountType: tp!.discountType,
                actualPrice: tp!.actualPrice,
                quantity: tp!.quantity,
                sessionIndex: 0,
                paidMoney: tpContainer.paidMoney,
                debtMoney: tpContainer.debtMoney,
              }
              return ticketPaymentItem
            }),
          ticketLaboratoryBodyList: Object.entries(ticketLaboratoryAction.value)
            .filter(([id, tlContainer]) => !!tlContainer && tlContainer.checked)
            .map(([id, tlContainer]) => {
              const tl = tlContainer.data
              const ticketPaymentItem: PaymentTicketItemBody = {
                ticketItemId: tl!.id,
                interactId: tl!.laboratoryId,
                ticketItemType: TicketItemType.TicketLaboratory,
                expectedPrice: tl!.expectedPrice,
                discountMoney: tl!.discountMoney,
                discountPercent: tl!.discountPercent,
                discountType: tl!.discountType,
                actualPrice: tl!.actualPrice,
                quantity: 1,
                sessionIndex: 0,
                paidMoney: tlContainer.paidMoney,
                debtMoney: tlContainer.debtMoney,
              }
              return ticketPaymentItem
            }),
          ticketRadiologyBodyList: Object.entries(ticketRadiologyAction.value)
            .filter(([id, trContainer]) => !!trContainer && trContainer.checked)
            .map(([id, trContainer]) => {
              const tr = trContainer.data
              const ticketPaymentItem: PaymentTicketItemBody = {
                ticketItemId: tr!.id,
                interactId: tr!.radiologyId,
                ticketItemType: TicketItemType.TicketRadiology,
                expectedPrice: tr!.expectedPrice,
                discountMoney: tr!.discountMoney,
                discountPercent: tr!.discountPercent,
                discountType: tr!.discountType,
                actualPrice: tr!.actualPrice,
                quantity: 1,
                sessionIndex: 0,
                paidMoney: trContainer.paidMoney,
                debtMoney: trContainer.debtMoney,
              }
              return ticketPaymentItem
            }),
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
    console.log('🚀 ~ ModalPrepaymentTicketItem.vue:216 ~ startPaymentMoney ~ error:', error)
  }
}

const startPrint = async () => {
  try {
    const paymentTemp = Payment.blank()
    paymentTemp.voucherType = PaymentVoucherType.Ticket
    paymentTemp.voucherId = ticket.value.id
    paymentTemp.personType = PaymentPersonType.Customer
    paymentTemp.personId = ticket.value.customerId
    paymentTemp.paymentActionType = paymentActionType.value

    paymentTemp.createdAt = Date.now()
    paymentTemp.moneyDirection = MoneyDirection.In
    paymentTemp.cashierId = MeService.user.value!.id
    paymentTemp.note = note.value
    paymentTemp.walletId = walletId.value

    paymentTemp.hasPaymentItem = 1
    paymentTemp.paidTotal = paidTotal.value
    paymentTemp.debtTotal = debtTotal.value

    const paymentTicketItemOther: PaymentTicketItem[] = []
    if (paidWait.value) {
      const pii = PaymentTicketItem.blank()
      pii.ticketItemType = TicketItemType.WAIT
      pii.paidMoney = paidWait.value
      pii.debtMoney = 0
      paymentTicketItemOther.push(pii)
    }
    if (paidSurchargeAction.value.checked) {
      const pii = PaymentTicketItem.blank()
      pii.ticketItemType = TicketItemType.Surcharge
      pii.paidMoney = paidSurchargeAction.value.paidMoney
      pii.debtMoney = paidSurchargeAction.value.debtMoney
      paymentTicketItemOther.push(pii)
    }
    if (paidDiscountAction.value.checked) {
      const pii = PaymentTicketItem.blank()
      pii.ticketItemType = TicketItemType.Discount
      pii.paidMoney = paidDiscountAction.value.paidMoney
      pii.debtMoney = paidDiscountAction.value.debtMoney
      paymentTicketItemOther.push(pii)
    }

    const paymentTicketItemRegimen: PaymentTicketItem[] = []

    const paymentTicketItemProcedureRegimen: PaymentTicketItem[] = Object.entries(
      ticketRegimenAction.value,
    )
      .filter(([id, trContainer]) => {
        return !!trContainer && (trContainer.paidItemMoney || trContainer.debtItemMoney)
      })
      .map(([id, trContainer]) => {
        const trpCheckbox = trContainer.trpCheckbox
        return Object.values(trpCheckbox)
          .filter((tpContainer) => tpContainer.checked)
          .map((tpContainer) => {
            const tp = tpContainer.data

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
            paymentTicketItem.sessionIndex = tp!.indexSession
            paymentTicketItem.paidMoney = tpContainer.paidMoney
            paymentTicketItem.debtMoney = tpContainer.debtMoney
            return paymentTicketItem
          })
      })
      .flat()

    const paymentTicketItemProcedure: PaymentTicketItem[] = Object.entries(
      ticketProcedureNormalAction.value,
    )
      .filter(([id, tpContainer]) => !!tpContainer && tpContainer.checked)
      .map(([id, tpContainer]) => {
        const tp = tpContainer.data
        const paymentTicketItem = PaymentTicketItem.blank()
        paymentTicketItem.ticketItemType = TicketItemType.TicketProcedure
        paymentTicketItem.ticketItemId = tp!.id
        paymentTicketItem.interactId = tp!.procedureId

        paymentTicketItem.expectedPrice = tp!.expectedPrice
        paymentTicketItem.discountMoney = tp!.discountMoney
        paymentTicketItem.discountPercent = tp!.discountPercent
        paymentTicketItem.discountType = tp!.discountType
        paymentTicketItem.actualPrice = tp!.actualPrice
        paymentTicketItem.quantity = tp!.quantity
        paymentTicketItem.sessionIndex = tp!.indexSession

        paymentTicketItem.paidMoney = tpContainer.paidMoney
        paymentTicketItem.debtMoney = tpContainer.debtMoney

        return paymentTicketItem
      })

    const paymentTicketItemConsumable: PaymentTicketItem[] = Object.entries(
      ticketConsumableAction.value,
    )
      .filter(([id, tpContainer]) => !!tpContainer && tpContainer.checked)
      .map(([id, tpContainer]) => {
        const tp = tpContainer.data
        const paymentTicketItem = PaymentTicketItem.blank()
        paymentTicketItem.ticketItemType = TicketItemType.TicketProductConsumable
        paymentTicketItem.ticketItemId = tp!.id
        paymentTicketItem.interactId = tp!.productId

        paymentTicketItem.expectedPrice = tp!.expectedPrice
        paymentTicketItem.actualPrice = tp!.actualPrice
        paymentTicketItem.quantity = tp!.quantity
        paymentTicketItem.discountMoney = tp!.discountMoney
        paymentTicketItem.discountPercent = tp!.discountPercent
        paymentTicketItem.discountType = tp!.discountType
        paymentTicketItem.sessionIndex = 0

        paymentTicketItem.paidMoney = tpContainer.paidMoney
        paymentTicketItem.debtMoney = tpContainer.debtMoney

        return paymentTicketItem
      })

    const paymentTicketItemPrescription: PaymentTicketItem[] = Object.entries(
      ticketPrescriptionAction.value,
    )
      .filter(([id, tpContainer]) => !!tpContainer && tpContainer.checked)
      .map(([id, tpContainer]) => {
        const tp = tpContainer.data
        const paymentTicketItem = PaymentTicketItem.blank()
        paymentTicketItem.ticketItemType = TicketItemType.TicketProductPrescription
        paymentTicketItem.ticketItemId = tp!.id
        paymentTicketItem.interactId = tp!.productId

        paymentTicketItem.expectedPrice = tp!.expectedPrice
        paymentTicketItem.discountMoney = tp!.discountMoney
        paymentTicketItem.discountPercent = tp!.discountPercent
        paymentTicketItem.discountType = tp!.discountType
        paymentTicketItem.actualPrice = tp!.actualPrice
        paymentTicketItem.quantity = tp!.quantity
        paymentTicketItem.sessionIndex = 0

        paymentTicketItem.paidMoney = tpContainer.paidMoney
        paymentTicketItem.debtMoney = tpContainer.debtMoney

        return paymentTicketItem
      })

    const paymentTicketItemLaboratory: PaymentTicketItem[] = Object.entries(
      ticketLaboratoryAction.value,
    )
      .filter(([id, tlContainer]) => !!tlContainer && tlContainer.checked)
      .map(([id, tlContainer]) => {
        const tl = tlContainer.data
        const paymentTicketItem = PaymentTicketItem.blank()
        paymentTicketItem.ticketItemType = TicketItemType.TicketLaboratory
        paymentTicketItem.ticketItemId = tl!.id
        paymentTicketItem.interactId = tl!.laboratoryId

        paymentTicketItem.expectedPrice = tl!.expectedPrice
        paymentTicketItem.discountMoney = tl!.discountMoney
        paymentTicketItem.discountPercent = tl!.discountPercent
        paymentTicketItem.discountType = tl!.discountType
        paymentTicketItem.actualPrice = tl!.actualPrice
        paymentTicketItem.quantity = 1
        paymentTicketItem.sessionIndex = 0

        paymentTicketItem.paidMoney = tlContainer.paidMoney
        paymentTicketItem.debtMoney = tlContainer.debtMoney

        return paymentTicketItem
      })

    const paymentTicketItemRadiology: PaymentTicketItem[] = Object.entries(
      ticketRadiologyAction.value,
    )
      .filter(([id, trContainer]) => !!trContainer && trContainer.checked)
      .map(([id, trContainer]) => {
        const tr = trContainer.data
        const paymentTicketItem = PaymentTicketItem.blank()
        paymentTicketItem.ticketItemType = TicketItemType.TicketRadiology
        paymentTicketItem.ticketItemId = tr!.id
        paymentTicketItem.interactId = tr!.radiologyId

        paymentTicketItem.expectedPrice = tr!.expectedPrice
        paymentTicketItem.discountMoney = tr!.discountMoney
        paymentTicketItem.discountPercent = tr!.discountPercent
        paymentTicketItem.discountType = tr!.discountType
        paymentTicketItem.actualPrice = tr!.actualPrice
        paymentTicketItem.quantity = 1
        paymentTicketItem.sessionIndex = 0

        paymentTicketItem.paidMoney = trContainer.paidMoney
        paymentTicketItem.debtMoney = trContainer.debtMoney

        return paymentTicketItem
      })

    paymentTemp.paymentTicketItemList = [
      ...paymentTicketItemOther,
      ...paymentTicketItemRegimen,
      ...paymentTicketItemProcedureRegimen,
      ...paymentTicketItemProcedure,
      ...paymentTicketItemConsumable,
      ...paymentTicketItemPrescription,
      ...paymentTicketItemLaboratory,
      ...paymentTicketItemRadiology,
    ]

    const paymentPrint = await Payment.refreshData(paymentTemp)
    if ([PaymentActionType.PaymentMoney].includes(paymentActionType.value)) {
      await PrintHtmlAction.startPrintCustomerPayment({
        customer: ticket.value.customer!,
        payment: paymentPrint,
      })
    } else if ([PaymentActionType.RefundMoney].includes(paymentActionType.value)) {
      await PrintHtmlAction.startPrintCustomerRefund({
        customer: ticket.value.customer!,
        payment: paymentPrint,
      })
    }
  } catch (error) {
    console.log('🚀 ~ ModalPrepaymentTicketItem.vue:380 ~ startPrint ~ error:', error)
  }
}

const disabledButtonSave = computed(() => {
  if (
    paidTotal.value === 0 &&
    paidItemMoney.value === 0 &&
    paidWait.value === 0 &&
    debtTotal.value === 0 &&
    debtItemMoney.value === 0
  ) {
    return true
  }
  return false
})

const handleUpdateCheckedTicketRegimen = (checked: boolean, tr: TicketRegimen) => {
  const trContainer = ticketRegimenAction.value[tr.id]

  trContainer.checked = checked
  let paidItemMoney = 0
  let debtItemMoney = 0
  Object.values(trContainer.trpCheckbox).forEach((tpContainer) => {
    tpContainer.checked = checked
    if (checked) {
      paidItemMoney += tpContainer.paidMoney
      debtItemMoney += tpContainer.debtMoney
    }
  })
  trContainer.paidItemMoney = paidItemMoney
  trContainer.debtItemMoney = debtItemMoney
}

const handleUpdateCheckedTicketProcedureRegimen = (checked: boolean, trp: TicketProcedure) => {
  const trContainer = ticketRegimenAction.value[trp.ticketRegimenId]
  const tpContainer = trContainer.trpCheckbox[trp.id]

  if (checked) {
    trContainer.paidItemMoney += tpContainer.paidMoney
    trContainer.debtItemMoney += tpContainer.debtMoney
  } else {
    trContainer.paidItemMoney -= tpContainer.paidMoney
    trContainer.debtItemMoney -= tpContainer.debtMoney
  }

  const trpCheckboxList = Object.values(trContainer.trpCheckbox)
  const checkAll = trpCheckboxList.every((i) => i.checked)
  const unCheckAll = trpCheckboxList.every((i) => !i.checked)
  if (checkAll) {
    trContainer.checked = true
    trContainer.indeterminate = false
  } else if (unCheckAll) {
    trContainer.checked = false
    trContainer.indeterminate = false
  } else {
    trContainer.checked = false
    trContainer.indeterminate = true
  }
}

defineExpose({ openModal, openModalByTicket })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 40px; width: 800px" @close="closeModal">
    <div class="bg-white">
      <div
        class="pl-4 pb-2 pt-3 flex items-center justify-between"
        style="border-bottom: 1px solid #dedede"
      >
        <div
          v-if="paymentActionType === PaymentActionType.PaymentMoney"
          class="font-medium text-lg"
        >
          Thông tin thanh toán: {{ ticket.customer?.fullName }}
        </div>
        <div
          v-if="paymentActionType === PaymentActionType.RefundMoney"
          class="font-medium text-lg"
          style="font-weight: bold; color: var(--text-red)"
        >
          Thông tin HOÀN TRẢ: {{ ticket.customer?.fullName }}
        </div>
        <div
          v-if="paymentActionType === PaymentActionType.Debit"
          class="font-medium text-lg"
          style="font-weight: bold; color: var(--text-red)"
        >
          GHI NỢ: {{ ticket.customer?.fullName }}
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
            <template v-if="paymentActionType === PaymentActionType.PaymentMoney">
              <thead>
                <tr>
                  <th v-if="CONFIG.MODE === 'development'"></th>
                  <th></th>
                  <th></th>
                  <th></th>
                  <th>Thanh toán chung</th>
                  <th></th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td v-if="CONFIG.MODE === 'development'"></td>
                  <td></td>
                  <td class="text-center">1</td>
                  <td colspan="3">Thanh toán vào VÍ (tiền chờ)</td>
                  <td colspan="2">
                    <InputNumber v-model:value="paidWait" textAlign="right" />
                  </td>
                </tr>
              </tbody>
            </template>
            <template
              v-if="
                paymentActionType === PaymentActionType.RefundMoney &&
                ticketRoomRef.ticketPaymentDetail?.paidWait
              "
            >
              <thead>
                <tr>
                  <th v-if="CONFIG.MODE === 'development'"></th>
                  <th></th>
                  <th></th>
                  <th></th>
                  <th>Thanh toán chung</th>
                  <th></th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td v-if="CONFIG.MODE === 'development'"></td>
                  <td></td>
                  <td class="text-center">1</td>
                  <td colspan="3">
                    Hoàn trả tiền trong VÍ (đã thanh toán
                    {{ formatMoney(ticketRoomRef.ticketPaymentDetail?.paidWait) }})
                  </td>
                  <td colspan="2">
                    <InputNumber
                      :value="-paidWait"
                      @update:value="(v) => (paidWait = -v)"
                      textAlign="right"
                    />
                  </td>
                </tr>
              </tbody>
            </template>
            <template v-if="Object.values(ticketRegimenAction).length">
              <thead>
                <tr>
                  <th v-if="CONFIG.MODE === 'development'"></th>
                  <th style="width: 40px">Chọn</th>
                  <th>#</th>
                  <th></th>
                  <th>Liệu trình</th>
                  <th></th>
                  <th>Đơn Giá</th>
                  <th v-if="[PaymentActionType.PaymentMoney].includes(paymentActionType)">
                    Thanh toán
                  </th>
                  <th v-if="[PaymentActionType.Debit].includes(paymentActionType)">Ghi nợ</th>
                  <th v-if="[PaymentActionType.RefundMoney].includes(paymentActionType)">
                    Hoàn trả
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(trContainer, trId, index) in ticketRegimenAction" :key="trId">
                  <template v-if="Object.values(trContainer.trpCheckbox).length">
                    <tr>
                      <td
                        v-if="CONFIG.MODE === 'development'"
                        style="color: violet; text-align: center"
                      >
                        <VueTooltip>
                          <template #trigger>
                            <IconBug width="1.2em" height="1.2em" />
                          </template>
                          <div style="max-height: 600px; max-width: 800px; overflow-y: scroll">
                            <pre>{{ JSON.stringify(trContainer, null, 4) }}</pre>
                          </div>
                        </VueTooltip>
                      </td>
                      <td>
                        <div class="flex justify-center">
                          <InputCheckbox
                            :checked="trContainer.checked"
                            :indeterminate="trContainer.indeterminate"
                            @update:checked="
                              (checked) =>
                                handleUpdateCheckedTicketRegimen(checked, trContainer.data)
                            "
                          />
                        </div>
                      </td>
                      <td class="text-center">{{ index + 1 }}</td>
                      <td colspan="3">{{ trContainer.data.regimen?.name }}</td>
                      <td></td>
                      <td class="text-right">
                        <!-- {{ formatMoney(trContainer.data.paidItem) }} -->
                      </td>
                    </tr>
                    <template v-for="(trpContainer, tpId) in trContainer.trpCheckbox" :key="tpId">
                      <tr>
                        <td
                          v-if="CONFIG.MODE === 'development'"
                          style="color: violet; text-align: center"
                        >
                          <VueTooltip>
                            <template #trigger>
                              <IconBug width="1.2em" height="1.2em" />
                            </template>
                            <div style="max-height: 600px; max-width: 800px; overflow-y: scroll">
                              <pre>{{ JSON.stringify(trpContainer, null, 4) }}</pre>
                            </div>
                          </VueTooltip>
                        </td>
                        <td></td>
                        <td>
                          <div class="flex justify-center">
                            <InputCheckbox
                              v-model:checked="trpContainer.checked"
                              @update:checked="
                                (checked) =>
                                  handleUpdateCheckedTicketProcedureRegimen(
                                    checked,
                                    trpContainer.data,
                                  )
                              "
                            />
                          </div>
                        </td>
                        <td>
                          <PaymentMoneyStatusTooltip
                            :paymentMoneyStatus="trpContainer.data.paymentMoneyStatus"
                          />
                        </td>
                        <td colspan="2">
                          <div class="flex gap-1">
                            <span>{{ trpContainer.data.procedure?.name }}</span>
                            <span style="font-weight: 700">
                              ( buổi {{ trpContainer.data.indexSession }} )
                            </span>
                          </div>
                        </td>
                        <td class="text-right whitespace-nowrap">
                          <div
                            v-if="trpContainer.data.discountMoney"
                            class="text-xs italic text-red-500"
                          >
                            <del>
                              {{ formatMoney(Math.round(trpContainer.data.expectedPrice)) }}
                            </del>
                          </div>
                          <div>
                            {{ formatMoney(Math.round(trpContainer.data.actualPrice)) }}
                          </div>
                        </td>
                        <td
                          v-if="paymentActionType === PaymentActionType.PaymentMoney"
                          class="text-right"
                        >
                          {{ formatMoney(trpContainer.paidMoney) }}
                        </td>
                        <td
                          v-else-if="paymentActionType === PaymentActionType.Debit"
                          class="text-right"
                        >
                          {{ formatMoney(trpContainer.debtMoney) }}
                        </td>
                        <td
                          v-else-if="paymentActionType === PaymentActionType.RefundMoney"
                          class="text-right"
                        >
                          {{ formatMoney(-trpContainer.paidMoney) }}
                        </td>
                      </tr>
                    </template>
                  </template>
                </template>
              </tbody>
            </template>
            <template v-if="Object.values(ticketProcedureNormalAction).length">
              <thead>
                <tr>
                  <th v-if="CONFIG.MODE === 'development'"></th>
                  <th>Chọn</th>
                  <th>#</th>
                  <th></th>
                  <th>
                    <span>Dịch vụ</span>
                  </th>
                  <th>SL</th>
                  <th>Đơn giá</th>
                  <th v-if="[PaymentActionType.PaymentMoney].includes(paymentActionType)">
                    Thanh toán
                  </th>
                  <th v-if="[PaymentActionType.Debit].includes(paymentActionType)">Ghi nợ</th>
                  <th v-if="[PaymentActionType.RefundMoney].includes(paymentActionType)">
                    Hoàn trả
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(tpContainer, tpId, index) in ticketProcedureNormalAction" :key="tpId">
                  <td
                    v-if="CONFIG.MODE === 'development'"
                    style="color: violet; text-align: center"
                  >
                    <VueTooltip>
                      <template #trigger>
                        <IconBug width="1.2em" height="1.2em" />
                      </template>
                      <div style="max-height: 600px; max-width: 800px; overflow-y: scroll">
                        <pre>{{ JSON.stringify(tpContainer, null, 4) }}</pre>
                      </div>
                    </VueTooltip>
                  </td>
                  <td>
                    <div class="flex justify-center">
                      <InputCheckbox v-model:checked="tpContainer.checked" />
                    </div>
                  </td>
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>
                    <PaymentMoneyStatusTooltip
                      :paymentMoneyStatus="tpContainer.data.paymentMoneyStatus"
                    />
                  </td>
                  <td>{{ tpContainer.data.procedure?.name }}</td>
                  <td class="text-center">{{ tpContainer.data.quantity }}</td>
                  <td class="text-right whitespace-nowrap">
                    <div v-if="tpContainer.data.discountMoney" class="text-xs italic text-red-500">
                      <del>{{ formatMoney(tpContainer.data.expectedPrice) }}</del>
                    </div>
                    <div>{{ formatMoney(tpContainer.data.actualPrice) }}</div>
                  </td>
                  <td
                    v-if="paymentActionType === PaymentActionType.PaymentMoney"
                    class="text-right"
                  >
                    {{ formatMoney(tpContainer.paidMoney) }}
                  </td>
                  <td v-else-if="paymentActionType === PaymentActionType.Debit" class="text-right">
                    {{ formatMoney(tpContainer.debtMoney) }}
                  </td>
                  <td
                    v-else-if="paymentActionType === PaymentActionType.RefundMoney"
                    class="text-right"
                  >
                    {{ formatMoney(-tpContainer.paidMoney) }}
                  </td>
                </tr>
              </tbody>
            </template>
            <template v-if="Object.values(ticketConsumableAction).length">
              <thead>
                <tr>
                  <th v-if="CONFIG.MODE === 'development'"></th>
                  <th>Chọn</th>
                  <th>#</th>
                  <th></th>
                  <th>
                    <span>Vật tư</span>
                  </th>
                  <th>SL</th>
                  <th>Đơn giá</th>
                  <th v-if="[PaymentActionType.PaymentMoney].includes(paymentActionType)">
                    Thanh toán
                  </th>
                  <th v-if="[PaymentActionType.Debit].includes(paymentActionType)">Ghi nợ</th>
                  <th v-if="[PaymentActionType.RefundMoney].includes(paymentActionType)">
                    Hoàn trả
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(tpContainer, tpId, index) in ticketConsumableAction" :key="tpId">
                  <td
                    v-if="CONFIG.MODE === 'development'"
                    style="color: violet; text-align: center"
                  >
                    <VueTooltip>
                      <template #trigger>
                        <IconBug width="1.2em" height="1.2em" />
                      </template>
                      <div style="max-height: 600px; max-width: 800px; overflow-y: scroll">
                        <pre>{{ JSON.stringify(tpContainer, null, 4) }}</pre>
                      </div>
                    </VueTooltip>
                  </td>
                  <td>
                    <div class="flex justify-center">
                      <InputCheckbox v-model:checked="tpContainer.checked" />
                    </div>
                  </td>
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>
                    <PaymentMoneyStatusTooltip
                      :paymentMoneyStatus="tpContainer.data.paymentMoneyStatus"
                    />
                  </td>
                  <td>{{ tpContainer.data.product?.brandName }}</td>
                  <td class="text-center">{{ tpContainer.data.quantity }}</td>
                  <td class="text-right whitespace-nowrap">
                    <div v-if="tpContainer.data.discountMoney" class="text-xs italic text-red-500">
                      <del>{{ formatMoney(tpContainer.data.expectedPrice) }}</del>
                    </div>
                    <div>{{ formatMoney(tpContainer.data.actualPrice) }}</div>
                  </td>
                  <td
                    v-if="paymentActionType === PaymentActionType.PaymentMoney"
                    class="text-right"
                  >
                    {{ formatMoney(tpContainer.paidMoney) }}
                  </td>
                  <td v-else-if="paymentActionType === PaymentActionType.Debit" class="text-right">
                    {{ formatMoney(tpContainer.debtMoney) }}
                  </td>
                  <td
                    v-else-if="paymentActionType === PaymentActionType.RefundMoney"
                    class="text-right"
                  >
                    {{ formatMoney(-tpContainer.paidMoney) }}
                  </td>
                </tr>
              </tbody>
            </template>
            <template v-if="Object.values(ticketPrescriptionAction).length">
              <thead>
                <tr>
                  <th v-if="CONFIG.MODE === 'development'"></th>
                  <th>Chọn</th>
                  <th>#</th>
                  <th></th>
                  <th>
                    <span>Thuốc</span>
                  </th>
                  <th>SL</th>
                  <th>Đơn giá</th>
                  <th v-if="[PaymentActionType.PaymentMoney].includes(paymentActionType)">
                    Thanh toán
                  </th>
                  <th v-if="[PaymentActionType.Debit].includes(paymentActionType)">Ghi nợ</th>
                  <th v-if="[PaymentActionType.RefundMoney].includes(paymentActionType)">
                    Hoàn trả
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(tpContainer, tpId, index) in ticketPrescriptionAction" :key="tpId">
                  <td
                    v-if="CONFIG.MODE === 'development'"
                    style="color: violet; text-align: center"
                  >
                    <VueTooltip>
                      <template #trigger>
                        <IconBug width="1.2em" height="1.2em" />
                      </template>
                      <div style="max-height: 600px; max-width: 800px; overflow-y: scroll">
                        <pre>{{ JSON.stringify(tpContainer, null, 4) }}</pre>
                      </div>
                    </VueTooltip>
                  </td>
                  <td>
                    <div class="flex justify-center">
                      <InputCheckbox v-model:checked="tpContainer.checked" />
                    </div>
                  </td>
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>
                    <PaymentMoneyStatusTooltip
                      :paymentMoneyStatus="tpContainer.data.paymentMoneyStatus"
                    />
                  </td>
                  <td>{{ tpContainer.data.product?.brandName }}</td>
                  <td class="text-center">{{ tpContainer.data.quantity }}</td>
                  <td class="text-right whitespace-nowrap">
                    <div v-if="tpContainer.data.discountMoney" class="text-xs italic text-red-500">
                      <del>{{ formatMoney(tpContainer.data.expectedPrice) }}</del>
                    </div>
                    <div>{{ formatMoney(tpContainer.data.actualPrice) }}</div>
                  </td>
                  <td
                    v-if="paymentActionType === PaymentActionType.PaymentMoney"
                    class="text-right"
                  >
                    {{ formatMoney(tpContainer.paidMoney) }}
                  </td>
                  <td v-else-if="paymentActionType === PaymentActionType.Debit" class="text-right">
                    {{ formatMoney(tpContainer.debtMoney) }}
                  </td>
                  <td
                    v-else-if="paymentActionType === PaymentActionType.RefundMoney"
                    class="text-right"
                  >
                    {{ formatMoney(-tpContainer.paidMoney) }}
                  </td>
                </tr>
              </tbody>
            </template>
            <template v-if="Object.values(ticketLaboratoryAction).length">
              <thead>
                <tr>
                  <th v-if="CONFIG.MODE === 'development'"></th>
                  <th>Chọn</th>
                  <th>#</th>
                  <th></th>
                  <th>
                    <span>Xét nghiệm</span>
                  </th>
                  <th></th>
                  <th></th>
                  <th v-if="[PaymentActionType.PaymentMoney].includes(paymentActionType)">
                    Thanh toán
                  </th>
                  <th v-if="[PaymentActionType.Debit].includes(paymentActionType)">Ghi nợ</th>
                  <th v-if="[PaymentActionType.RefundMoney].includes(paymentActionType)">
                    Hoàn trả
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(tlContainer, tlId, index) in ticketLaboratoryAction" :key="tlId">
                  <td
                    v-if="CONFIG.MODE === 'development'"
                    style="color: violet; text-align: center"
                  >
                    <VueTooltip>
                      <template #trigger>
                        <IconBug width="1.2em" height="1.2em" />
                      </template>
                      <div style="max-height: 600px; max-width: 800px; overflow-y: scroll">
                        <pre>{{ JSON.stringify(tlContainer, null, 4) }}</pre>
                      </div>
                    </VueTooltip>
                  </td>
                  <td>
                    <div class="flex justify-center">
                      <InputCheckbox v-model:checked="tlContainer.checked" />
                    </div>
                  </td>
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>
                    <PaymentMoneyStatusTooltip
                      :paymentMoneyStatus="tlContainer.data.paymentMoneyStatus"
                    />
                  </td>
                  <td colspan="3">{{ tlContainer.data.laboratory?.name }}</td>
                  <td
                    v-if="paymentActionType === PaymentActionType.PaymentMoney"
                    class="text-right"
                  >
                    {{ formatMoney(tlContainer.paidMoney) }}
                  </td>
                  <td v-else-if="paymentActionType === PaymentActionType.Debit" class="text-right">
                    {{ formatMoney(tlContainer.debtMoney) }}
                  </td>
                  <td
                    v-else-if="paymentActionType === PaymentActionType.RefundMoney"
                    class="text-right"
                  >
                    {{ formatMoney(-tlContainer.paidMoney) }}
                  </td>
                </tr>
              </tbody>
            </template>
            <template v-if="Object.values(ticketRadiologyAction).length">
              <thead>
                <tr>
                  <th v-if="CONFIG.MODE === 'development'"></th>
                  <th>Chọn</th>
                  <th>#</th>
                  <th></th>
                  <th>
                    <span>Phiếu CĐHA</span>
                  </th>
                  <th></th>
                  <th></th>
                  <th v-if="[PaymentActionType.PaymentMoney].includes(paymentActionType)">
                    Thanh toán
                  </th>
                  <th v-if="[PaymentActionType.Debit].includes(paymentActionType)">Ghi nợ</th>
                  <th v-if="[PaymentActionType.RefundMoney].includes(paymentActionType)">
                    Hoàn trả
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(trContainer, trId, index) in ticketRadiologyAction" :key="trId">
                  <td
                    v-if="CONFIG.MODE === 'development'"
                    style="color: violet; text-align: center"
                  >
                    <VueTooltip>
                      <template #trigger>
                        <IconBug width="1.2em" height="1.2em" />
                      </template>
                      <div style="max-height: 600px; max-width: 800px; overflow-y: scroll">
                        <pre>{{ JSON.stringify(trContainer, null, 4) }}</pre>
                      </div>
                    </VueTooltip>
                  </td>
                  <td>
                    <div class="flex justify-center">
                      <InputCheckbox v-model:checked="trContainer.checked" />
                    </div>
                  </td>
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>
                    <PaymentMoneyStatusTooltip
                      :paymentMoneyStatus="trContainer.data.paymentMoneyStatus"
                    />
                  </td>
                  <td colspan="3">{{ trContainer.data.radiology?.name }}</td>
                  <td
                    v-if="paymentActionType === PaymentActionType.PaymentMoney"
                    class="text-right"
                  >
                    {{ formatMoney(trContainer.paidMoney) }}
                  </td>
                  <td v-else-if="paymentActionType === PaymentActionType.Debit" class="text-right">
                    {{ formatMoney(trContainer.debtMoney) }}
                  </td>
                  <td
                    v-else-if="paymentActionType === PaymentActionType.RefundMoney"
                    class="text-right"
                  >
                    {{ formatMoney(-trContainer.paidMoney) }}
                  </td>
                </tr>
              </tbody>
            </template>

            <tbody>
              <template v-if="paymentActionType === PaymentActionType.PaymentMoney">
                <tr v-if="paidSurchargeAction.paidMoney">
                  <td v-if="CONFIG.MODE === 'development'"></td>
                  <td>
                    <div class="flex justify-center">
                      <InputCheckbox v-model:checked="paidSurchargeAction.checked" />
                    </div>
                  </td>
                  <td class="text-center"></td>
                  <td class="text-center"></td>
                  <td colspan="3">Tiền phụ phí</td>
                  <td colspan="1" style="text-align: right">
                    {{ formatMoney(paidSurchargeAction.paidMoney) }}
                  </td>
                </tr>
                <tr v-if="paidDiscountAction.paidMoney">
                  <td v-if="CONFIG.MODE === 'development'"></td>
                  <td>
                    <div class="flex justify-center">
                      <InputCheckbox v-model:checked="paidDiscountAction.checked" />
                    </div>
                  </td>
                  <td class="text-center"></td>
                  <td class="text-center"></td>
                  <td colspan="3">Tiền khuyến mại</td>
                  <td colspan="1" style="text-align: right">
                    {{ formatMoney(paidDiscountAction.paidMoney) }}
                  </td>
                </tr>
              </template>
              <template v-if="paymentActionType === PaymentActionType.Debit">
                <tr v-if="paidSurchargeAction.debtMoney">
                  <td v-if="CONFIG.MODE === 'development'"></td>
                  <td>
                    <div class="flex justify-center">
                      <InputCheckbox v-model:checked="paidSurchargeAction.checked" />
                    </div>
                  </td>
                  <td class="text-center"></td>
                  <td class="text-center"></td>
                  <td colspan="3">Ghi nợ phụ phí</td>
                  <td colspan="1" style="text-align: right">
                    {{ formatMoney(paidSurchargeAction.debtMoney) }}
                  </td>
                </tr>
                <tr v-if="paidDiscountAction.debtMoney">
                  <td v-if="CONFIG.MODE === 'development'"></td>
                  <td>
                    <div class="flex justify-center">
                      <InputCheckbox v-model:checked="paidDiscountAction.checked" />
                    </div>
                  </td>
                  <td class="text-center"></td>
                  <td class="text-center"></td>
                  <td colspan="3">Ghi nợ khuyến mại</td>
                  <td colspan="1" style="text-align: right">
                    {{ formatMoney(-paidDiscountAction.debtMoney) }}
                  </td>
                </tr>
              </template>
              <template v-if="paymentActionType === PaymentActionType.RefundMoney">
                <tr v-if="paidSurchargeAction.paidMoney || paidSurchargeAction.debtMoney">
                  <td v-if="CONFIG.MODE === 'development'"></td>
                  <td>
                    <div class="flex justify-center">
                      <InputCheckbox v-model:checked="paidSurchargeAction.checked" />
                    </div>
                  </td>
                  <td class="text-center"></td>
                  <td class="text-center"></td>
                  <td colspan="3">Hoàn trả phụ phí</td>
                  <td colspan="1" style="text-align: right">
                    {{ formatMoney(-paidSurchargeAction.paidMoney) }}
                  </td>
                </tr>
                <tr v-if="paidDiscountAction.paidMoney || paidDiscountAction.debtMoney">
                  <td v-if="CONFIG.MODE === 'development'"></td>
                  <td>
                    <div class="flex justify-center">
                      <InputCheckbox v-model:checked="paidDiscountAction.checked" />
                    </div>
                  </td>
                  <td class="text-center"></td>
                  <td class="text-center"></td>
                  <td colspan="3">Hoàn trả khuyến mại</td>
                  <td colspan="1" style="text-align: right">
                    {{ formatMoney(-paidDiscountAction.paidMoney) }}
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div class="mt-2 ml-2 flex justify-center">
          <InputCheckbox v-model:value="pickAll" @update:checked="startPickAll">
            <a class="underline">Chọn tất cả</a>
          </InputCheckbox>
        </div>
        <div class="flex flex-wrap gap-4 mt-4">
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <template v-if="paymentActionType === PaymentActionType.PaymentMoney">
              <div>Phương thức thanh toán</div>
              <div>
                <InputSelectWallet v-model:walletId="walletId" autoSelectFirstValue />
              </div>
            </template>
            <template v-if="paymentActionType === PaymentActionType.RefundMoney">
              <div>Phương thức hoàn trả</div>
              <div>
                <InputSelectWallet v-model:walletId="walletId" autoSelectFirstValue />
              </div>
            </template>
            <template v-if="paymentActionType === PaymentActionType.Debit">
              <div>Phương thức ghi nợ</div>
              <div>
                <InputText :value="''" disabled />
              </div>
            </template>
          </div>
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <template v-if="paymentActionType === PaymentActionType.PaymentMoney">
              <div>Số tiền thanh toán</div>
              <div class="flex">
                <InputMoney ref="inputMoneyPay" :value="paidTotal" textAlign="right" disabled />
              </div>
            </template>
            <template v-if="paymentActionType === PaymentActionType.Debit">
              <div>Số tiền ghi nợ</div>
              <div class="flex">
                <InputMoney ref="inputMoneyPay" :value="debtTotal" textAlign="right" disabled />
              </div>
            </template>
            <template v-if="paymentActionType === PaymentActionType.RefundMoney">
              <div>Số tiền hoàn trả</div>
              <div class="flex">
                <InputMoney ref="inputMoneyPay" :value="-paidTotal" textAlign="right" disabled />
              </div>
            </template>
          </div>
          <div
            v-if="paymentActionType === PaymentActionType.RefundMoney && debtTotal !== 0"
            style="flex-grow: 1; flex-basis: 40%; min-width: 300px"
          >
            <div>Số tiền hoàn nợ</div>
            <div class="flex">
              <InputMoney ref="inputMoneyPay" :value="-debtTotal" textAlign="right" disabled />
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
        <div class="ml-auto">
          <VueButton
            v-if="
              [PaymentActionType.PaymentMoney, PaymentActionType.RefundMoney].includes(
                paymentActionType,
              )
            "
            color="blue"
            @click="startPrint"
            icon="print"
            :disabled="disabledButtonSave"
          >
            In
          </VueButton>
        </div>
        <VueButton
          color="blue"
          @click="startPaymentMoney"
          icon="dollar"
          :disabled="disabledButtonSave"
        >
          <span v-if="paymentActionType === PaymentActionType.PaymentMoney">
            Xác nhận thanh toán
          </span>
          <span v-if="paymentActionType === PaymentActionType.RefundMoney">Xác nhận HOÀN TRẢ</span>
          <span v-if="paymentActionType === PaymentActionType.Debit">Xác nhận GHI NỢ</span>
        </VueButton>
      </div>
    </div>
  </VueModal>
</template>
