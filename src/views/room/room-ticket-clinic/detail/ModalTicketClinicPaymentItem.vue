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
import { TicketItemPaymentType } from '@/modules/enum'
import { PaymentTicket, PaymentTicketItemType } from '@/modules/payment_ticket'
import { TemplateHtmlAction } from '@/modules/template-html'
import { ticketRef } from '@/store/room.store'
import { Ticket, TicketMoneyApi, TicketService, type PaymentTicketItemBody } from '@/modules/ticket'
import type { TicketLaboratory } from '@/modules/ticket-laboratory'
import type { TicketProcedure } from '@/modules/ticket-procedure'
import type { TicketProduct } from '@/modules/ticket-product'
import type { TicketRadiology } from '@/modules/ticket-radiology'
import type { TicketRegimen } from '@/modules/ticket-regimen'
import { BugDevelopment } from '@/views/component'
import InputSelectWallet from '@/views/component/InputSelectWallet.vue'
import TicketItemPaymentTypeTooltip from '@/views/room/room-ticket-base/TicketItemPaymentTypeTooltip.vue'
import { computed, ref } from 'vue'
import {
  MoneyDirection,
  PaymentActionType,
  PaymentPersonType,
} from '@/modules/payment/payment.type'
import { Payment } from '@/modules/payment/payment.model'
import { TicketActionType } from '@/modules/ticket/ticket.type'
import { Procedure } from '@/modules/procedure'
import { Product } from '@/modules/product'
import { Laboratory } from '@/modules/laboratory'
import { Radiology } from '@/modules/radiology'

const emit = defineEmits<{ (e: 'success'): void }>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

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
      paidItemMoney: number
      trpCheckbox: Record<
        string, // trpId
        { data: TicketProcedure; checked: boolean; paidMoney: number }
      >
    }
  >
>({})

const ticketProcedureNormalAction = ref<
  Record<string, { data: TicketProcedure; checked: boolean; paidMoney: number }>
>({})
const ticketPrescriptionAction = ref<
  Record<string, { data: TicketProduct; checked: boolean; paidMoney: number }>
>({})
const ticketConsumableAction = ref<
  Record<string, { data: TicketProduct; checked: boolean; paidMoney: number }>
>({})
const ticketLaboratoryAction = ref<
  Record<string, { data: TicketLaboratory; checked: boolean; paidMoney: number }>
>({})
const ticketRadiologyAction = ref<
  Record<string, { data: TicketRadiology; checked: boolean; paidMoney: number }>
>({})

const paidWait = ref(0)
const paidSurchargeAction = ref({ checked: false, paidMoney: 0 })
const paidDiscountAction = ref({ checked: false, paidMoney: 0 })

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

const paidTotal = computed(() => {
  const surchargeMoney = paidSurchargeAction.value.checked ? paidSurchargeAction.value.paidMoney : 0
  const discountMoney = paidDiscountAction.value.checked ? paidDiscountAction.value.paidMoney : 0
  return paidWait.value + surchargeMoney + discountMoney + paidItemMoney.value
})

const refreshData = async () => {
  await ticket.value.refreshAllData()

  paidSurchargeAction.value = { checked: false, paidMoney: 0 }
  paidDiscountAction.value = { checked: false, paidMoney: 0 }

  if (paymentActionType.value === PaymentActionType.PaymentMoney) {
    paidSurchargeAction.value.paidMoney =
      ticket.value.surcharge - ticket.value.ticketPaymentDetail.paidSurcharge

    // do ticket.value.discountMoney là số dương
    // còn ticket.value.ticketPaymentDetail.paidDiscount là số âm
    paidDiscountAction.value.paidMoney =
      -ticket.value.ticketPaymentDetail.paidDiscount - ticket.value.discountMoney
  } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
    paidSurchargeAction.value.paidMoney = -ticket.value.ticketPaymentDetail.paidSurcharge
    paidDiscountAction.value.paidMoney = -ticket.value.ticketPaymentDetail.paidDiscount
  }

  ticketRegimenAction.value = {}
  ticketProcedureNormalAction.value = {}
  ticketPrescriptionAction.value = {}
  ticketConsumableAction.value = {}
  ticketLaboratoryAction.value = {}
  ticketRadiologyAction.value = {}

  const ticketRegimenPayment = (ticket.value.ticketRegimenList || [])
    .filter((i) => {
      if (paymentActionType.value === PaymentActionType.RefundMoney) {
        return i.paidItem || i.paid
      }
      if (paymentActionType.value === PaymentActionType.PaymentMoney) {
        return i.paidItem !== i.actualPrice
      }
      return true // Tạm thời cho hiện hết các liệu trình
    })
    .forEach((tr) => {
      ticketRegimenAction.value[tr.id] = {
        checked: false,
        indeterminate: false,
        paidMoney: 0,
        paidItemMoney: 0,
        data: tr,
        trpCheckbox: {},
      }
      tr.ticketProcedureList?.forEach((trp) => {
        let paidMoney = 0
        if (paymentActionType.value === PaymentActionType.PaymentMoney) {
          paidMoney = trp.actualPrice * trp.quantity - trp.paid
        } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
          paidMoney = -trp.paid
        }

        if (paidMoney != 0) {
          ticketRegimenAction.value[tr.id].trpCheckbox[trp.id] = {
            checked: false,
            data: trp,
            paidMoney,
          }
        }
      })
    })

  const ticketProcedureNormalPayment = (ticket.value.ticketProcedureNormalList || [])
    .filter((i) => {
      if (paymentActionType.value === PaymentActionType.PaymentMoney) {
        return i.paid < i.actualPrice * i.quantity
      } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
        return i.paid != 0
      }
    })
    .forEach((i) => {
      let paidMoney = 0
      if (paymentActionType.value === PaymentActionType.PaymentMoney) {
        paidMoney = i.actualPrice * i.quantity - i.paid
      } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
        paidMoney = -i.paid
      }
      ticketProcedureNormalAction.value[i.id] = { checked: false, data: i, paidMoney }
    })

  const ticketConsumablePayment = (ticket.value.ticketProductConsumableList || [])
    .filter((i) => {
      if (paymentActionType.value === PaymentActionType.PaymentMoney) {
        return i.paid < i.unitActualPrice * i.unitQuantity
      } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
        return i.paid != 0
      }
    })
    .forEach((i) => {
      let paidMoney = 0
      if (paymentActionType.value === PaymentActionType.PaymentMoney) {
        paidMoney = i.unitActualPrice * i.unitQuantity - i.paid
      } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
        paidMoney = -i.paid
      }
      ticketConsumableAction.value[i.id] = { checked: false, data: i, paidMoney }
    })

  const ticketPrescriptionPayment = (ticket.value.ticketProductPrescriptionList || [])
    .filter((i) => {
      if (paymentActionType.value === PaymentActionType.PaymentMoney) {
        return i.paid < i.unitActualPrice * i.unitQuantity
      } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
        return i.paid != 0
      }
    })
    .forEach((i) => {
      let paidMoney = 0
      if (paymentActionType.value === PaymentActionType.PaymentMoney) {
        paidMoney = i.unitActualPrice * i.unitQuantity - i.paid
      } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
        paidMoney = -i.paid
      }
      ticketPrescriptionAction.value[i.id] = { checked: false, data: i, paidMoney }
    })

  const ticketLaboratoryPayment = (ticket.value.ticketLaboratoryList || [])
    .filter((i) => {
      if (paymentActionType.value === PaymentActionType.PaymentMoney) {
        return i.paid < i.actualPrice
      } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
        return i.paid != 0
      }
    })
    .forEach((i) => {
      let paidMoney = 0
      if (paymentActionType.value === PaymentActionType.PaymentMoney) {
        paidMoney = i.actualPrice - i.paid
      } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
        paidMoney = -i.paid
      }
      ticketLaboratoryAction.value[i.id] = { checked: false, data: i, paidMoney }
    })

  const ticketRadiologyPayment = (ticket.value.ticketRadiologyList || [])
    .filter((i) => {
      if (paymentActionType.value === PaymentActionType.PaymentMoney) {
        return i.paid < i.actualPrice
      } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
        return i.paid != 0
      }
    })
    .forEach((i) => {
      let paidMoney = 0
      if (paymentActionType.value === PaymentActionType.PaymentMoney) {
        paidMoney = i.actualPrice - i.paid
      } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
        paidMoney = -i.paid
      }
      ticketRadiologyAction.value[i.id] = { checked: false, data: i, paidMoney }
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
  paidSurchargeAction.value = { checked: false, paidMoney: 0 }
  paidDiscountAction.value = { checked: false, paidMoney: 0 }
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
      }
    })
    trContainer.paidItemMoney = paidItemMoney
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
    let ticketActionType: TicketActionType
    if (paymentActionType.value === PaymentActionType.PaymentMoney) {
      ticketActionType = TicketActionType.PaymentItem
    } else if (paymentActionType.value === PaymentActionType.RefundMoney) {
      ticketActionType = TicketActionType.RefundItem
    } else {
      throw new Error('Invalid payment action type')
    }

    const paymentResult = await TicketMoneyApi.paymentMoney({
      ticketId: ticket.value.id,
      body: {
        paymentActionType: paymentActionType.value,
        ticketActionType: ticketActionType,
        walletId: walletId.value,
        isPaymentEachItem: 1,
        paidTotal: paidTotal.value,
        note: note.value,
        paymentTicketItemMap: {
          paymentWait: { paidMoney: paidWait.value },
          paymentSurcharge: (() => {
            let paidMoney = 0
            if (paidSurchargeAction.value.checked) {
              paidMoney = paidSurchargeAction.value.paidMoney
            }
            return { paidMoney }
          })(),
          paymentDiscount: (() => {
            let paidMoney = 0
            if (paidDiscountAction.value.checked) {
              paidMoney = paidDiscountAction.value.paidMoney
            }
            return { paidMoney }
          })(),
          paymentTicketRegimenList: [],
          paymentTicketProcedureNoEffectList: Object.values(ticketRegimenAction.value)
            .filter((v) => v.paidItemMoney !== 0)
            .map((value) => {
              const trpCheckbox = value.trpCheckbox
              return Object.values(trpCheckbox)
                .filter((tpContainer) => {
                  return (
                    tpContainer.checked &&
                    tpContainer.data.ticketItemPaymentType === TicketItemPaymentType.NoEffect
                  )
                })
                .map((tpContainer) => {
                  const tp = tpContainer.data
                  const ticketPaymentItem: PaymentTicketItemBody = {
                    paymentTicketItemType: PaymentTicketItemType.TicketProcedure,
                    ticketItemId: tp.id,
                    ticketItemInteractId: tp.procedureId,
                    expectedPrice: tp.expectedPrice,
                    discountType: tp.discountType,
                    discountMoney: tp.discountMoney,
                    discountPercent: tp.discountPercent,
                    actualPrice: tp.actualPrice,
                    quantity: tp.quantity,
                    unitRate: 1,
                    sessionIndex: tp.indexSession,
                    paidMoney: tpContainer.paidMoney,
                  }
                  return ticketPaymentItem
                })
            })
            .flat(),
          paymentTicketProcedureHasEffectList: [
            ...Object.values(ticketRegimenAction.value)
              .filter((v) => v.paidItemMoney !== 0)
              .map((value) => {
                const trpCheckbox = value.trpCheckbox
                return Object.values(trpCheckbox)
                  .filter((tpContainer) => {
                    return (
                      tpContainer.checked &&
                      tpContainer.data.ticketItemPaymentType !== TicketItemPaymentType.NoEffect
                    )
                  })
                  .map((tpContainer) => {
                    const tp = tpContainer.data
                    const ticketPaymentItem: PaymentTicketItemBody = {
                      paymentTicketItemType: PaymentTicketItemType.TicketProcedure,
                      ticketItemId: tp.id,
                      ticketItemInteractId: tp.procedureId,
                      expectedPrice: tp.expectedPrice,
                      discountType: tp.discountType,
                      discountMoney: tp.discountMoney,
                      discountPercent: tp.discountPercent,
                      actualPrice: tp.actualPrice,
                      quantity: tp.quantity,
                      unitRate: 1,
                      sessionIndex: tp.indexSession,
                      paidMoney: tpContainer.paidMoney,
                    }
                    return ticketPaymentItem
                  })
              })
              .flat(),
            ...Object.entries(ticketProcedureNormalAction.value)
              .filter(([id, tpContainer]) => {
                return (
                  tpContainer.checked &&
                  tpContainer.data.ticketItemPaymentType !== TicketItemPaymentType.NoEffect
                )
              })
              .map(([id, tpContainer]) => {
                const tp = tpContainer.data
                const ticketPaymentItem: PaymentTicketItemBody = {
                  paymentTicketItemType: PaymentTicketItemType.TicketProcedure,
                  ticketItemId: tp!.id,
                  ticketItemInteractId: tp!.procedureId,
                  expectedPrice: tp!.expectedPrice,
                  discountType: tp!.discountType,
                  discountMoney: tp!.discountMoney,
                  discountPercent: tp!.discountPercent,
                  actualPrice: tp!.actualPrice,
                  quantity: tp!.quantity,
                  unitRate: 1,
                  sessionIndex: tp!.indexSession,
                  paidMoney: tpContainer.paidMoney,
                }
                return ticketPaymentItem
              }),
          ],
          paymentTicketProductConsumableList: Object.entries(ticketConsumableAction.value)
            .filter(([id, tpContainer]) => !!tpContainer && tpContainer.checked)
            .map(([id, tpContainer]) => {
              const tp = tpContainer.data
              const ticketPaymentItem: PaymentTicketItemBody = {
                paymentTicketItemType: PaymentTicketItemType.TicketProductConsumable,
                ticketItemId: tp!.id,
                ticketItemInteractId: tp!.productId,
                expectedPrice: Math.floor(tp!.unitExpectedPrice / tp.unitRate),
                discountType: tp!.discountType,
                discountMoney: Math.floor(tp!.unitDiscountMoney / tp.unitRate),
                discountPercent: tp!.discountPercent,
                actualPrice: Math.floor(tp!.unitActualPrice / tp.unitRate),
                quantity: tp!.unitRate * tp.unitQuantity,
                unitRate: tp.unitRate,
                sessionIndex: 0,
                paidMoney: tpContainer.paidMoney,
              }
              return ticketPaymentItem
            }),
          paymentTicketProductPrescriptionList: Object.entries(ticketPrescriptionAction.value)
            .filter(([id, tpContainer]) => !!tpContainer && tpContainer.checked)
            .map(([id, tpContainer]) => {
              const tp = tpContainer.data
              const ticketPaymentItem: PaymentTicketItemBody = {
                paymentTicketItemType: PaymentTicketItemType.TicketProductPrescription,
                ticketItemId: tp!.id,
                ticketItemInteractId: tp!.productId,
                expectedPrice: Math.floor(tp!.unitExpectedPrice / tp.unitRate),
                discountMoney: Math.floor(tp!.unitDiscountMoney / tp.unitRate),
                discountPercent: tp!.discountPercent,
                discountType: tp!.discountType,
                actualPrice: Math.floor(tp!.unitActualPrice / tp.unitRate),
                quantity: tp!.unitRate * tp.unitQuantity,
                unitRate: tp.unitRate,
                sessionIndex: 0,
                paidMoney: tpContainer.paidMoney,
              }
              return ticketPaymentItem
            }),
          paymentTicketLaboratoryList: Object.entries(ticketLaboratoryAction.value)
            .filter(([id, tlContainer]) => !!tlContainer && tlContainer.checked)
            .map(([id, tlContainer]) => {
              const tl = tlContainer.data
              const ticketPaymentItem: PaymentTicketItemBody = {
                paymentTicketItemType: PaymentTicketItemType.TicketLaboratory,
                ticketItemId: tl!.id,
                ticketItemInteractId: tl!.laboratoryId,
                expectedPrice: tl!.expectedPrice,
                discountMoney: tl!.discountMoney,
                discountPercent: tl!.discountPercent,
                discountType: tl!.discountType,
                actualPrice: tl!.actualPrice,
                quantity: 1,
                unitRate: 1,
                sessionIndex: 0,
                paidMoney: tlContainer.paidMoney,
              }
              return ticketPaymentItem
            }),
          paymentTicketRadiologyList: Object.entries(ticketRadiologyAction.value)
            .filter(([id, trContainer]) => !!trContainer && trContainer.checked)
            .map(([id, trContainer]) => {
              const tr = trContainer.data
              const ticketPaymentItem: PaymentTicketItemBody = {
                paymentTicketItemType: PaymentTicketItemType.TicketRadiology,
                ticketItemId: tr!.id,
                ticketItemInteractId: tr!.radiologyId,
                expectedPrice: tr!.expectedPrice,
                discountMoney: tr!.discountMoney,
                discountPercent: tr!.discountPercent,
                discountType: tr!.discountType,
                actualPrice: tr!.actualPrice,
                quantity: 1,
                unitRate: 1,
                sessionIndex: 0,
                paidMoney: trContainer.paidMoney,
              }
              return ticketPaymentItem
            }),
        },
      },
    })

    if (options?.print) {
      const paymentPrint = Payment.from(paymentResult.paymentCreated)
      paymentPrint.customer = Customer.from(ticket.value.customer)
      await TemplateHtmlAction.startPrintCustomerPayment({
        payment: paymentPrint,
      })
    }

    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalPrepaymentTicket.vue:216 ~ startPaymentMoney ~ error:', error)
  }
}

const startPrint = async () => {
  try {
    const paymentTemp = Payment.blank()
    paymentTemp.personType = PaymentPersonType.Customer
    paymentTemp.personId = ticket.value.customerId
    paymentTemp.cashierId = MeService.user.value!.id
    paymentTemp.walletId = walletId.value

    paymentTemp.paymentActionType = paymentActionType.value
    paymentTemp.moneyDirection = MoneyDirection.In
    paymentTemp.createdAt = Date.now()
    paymentTemp.note = note.value

    paymentTemp.paidTotal = paidTotal.value
    paymentTemp.debtTotal = 0

    const paymentTicketOther: PaymentTicket[] = []
    if (paidWait.value) {
      const ptb = PaymentTicket.blank()
      ptb.paymentTicketItemType = PaymentTicketItemType.WAIT
      ptb.paidMoney = paidWait.value
      ptb.debtMoney = 0
      paymentTicketOther.push(ptb)
    }
    if (paidSurchargeAction.value.checked) {
      const ptb = PaymentTicket.blank()
      ptb.paymentTicketItemType = PaymentTicketItemType.Surcharge
      ptb.paidMoney = paidSurchargeAction.value.paidMoney
      ptb.debtMoney = 0
      paymentTicketOther.push(ptb)
    }
    if (paidDiscountAction.value.checked) {
      const ptb = PaymentTicket.blank()
      ptb.paymentTicketItemType = PaymentTicketItemType.Discount
      ptb.paidMoney = paidDiscountAction.value.paidMoney
      ptb.debtMoney = 0
      paymentTicketOther.push(ptb)
    }

    const paymentTicketRegimen: PaymentTicket[] = []

    const paymentTicketProcedureRegimen: PaymentTicket[] = Object.entries(ticketRegimenAction.value)
      .filter(([id, trContainer]) => {
        return !!trContainer && trContainer.paidItemMoney
      })
      .map(([id, trContainer]) => {
        const trpCheckbox = trContainer.trpCheckbox
        return Object.values(trpCheckbox)
          .filter((tpContainer) => tpContainer.checked)
          .map((tpContainer) => {
            const tp = tpContainer.data

            const paymentTicket = PaymentTicket.blank()
            paymentTicket.paymentTicketItemType = PaymentTicketItemType.TicketProcedure
            paymentTicket.ticketItemId = tp.id
            paymentTicket.ticketItemInteractId = tp.procedureId

            paymentTicket.expectedPrice = tp!.expectedPrice
            paymentTicket.discountMoney = tp!.discountMoney
            paymentTicket.discountPercent = tp!.discountPercent
            paymentTicket.discountType = tp!.discountType
            paymentTicket.actualPrice = tp!.actualPrice
            paymentTicket.quantity = tp!.quantity
            paymentTicket.sessionIndex = tp!.indexSession
            paymentTicket.paidMoney = tpContainer.paidMoney
            paymentTicket.debtMoney = 0

            paymentTicket.procedure = Procedure.from(tp.procedure || Procedure.blank())
            return paymentTicket
          })
      })
      .flat()

    const paymentTicketProcedure: PaymentTicket[] = Object.entries(
      ticketProcedureNormalAction.value,
    )
      .filter(([id, tpContainer]) => !!tpContainer && tpContainer.checked)
      .map(([id, tpContainer]) => {
        const tp = tpContainer.data
        const paymentTicket = PaymentTicket.blank()
        paymentTicket.paymentTicketItemType = PaymentTicketItemType.TicketProcedure
        paymentTicket.ticketItemId = tp!.id
        paymentTicket.ticketItemInteractId = tp!.procedureId

        paymentTicket.expectedPrice = tp!.expectedPrice
        paymentTicket.discountMoney = tp!.discountMoney
        paymentTicket.discountPercent = tp!.discountPercent
        paymentTicket.discountType = tp!.discountType
        paymentTicket.actualPrice = tp!.actualPrice
        paymentTicket.quantity = tp!.quantity
        paymentTicket.sessionIndex = tp!.indexSession

        paymentTicket.paidMoney = tpContainer.paidMoney
        paymentTicket.debtMoney = 0

        paymentTicket.procedure = Procedure.from(tp.procedure || Procedure.blank())

        return paymentTicket
      })

    const paymentTicketConsumable: PaymentTicket[] = Object.entries(ticketConsumableAction.value)
      .filter(([id, tpContainer]) => !!tpContainer && tpContainer.checked)
      .map(([id, tpContainer]) => {
        const tp = tpContainer.data
        const paymentTicket = PaymentTicket.blank()
        paymentTicket.paymentTicketItemType = PaymentTicketItemType.TicketProductConsumable
        paymentTicket.ticketItemId = tp!.id
        paymentTicket.ticketItemInteractId = tp!.productId

        paymentTicket.quantity = tp!.unitQuantity * tp!.unitRate
        paymentTicket.unitRate = tp!.unitRate
        paymentTicket.expectedPrice = Math.floor(tp!.unitExpectedPrice / tp!.unitRate)
        paymentTicket.actualPrice = Math.floor(tp!.unitActualPrice / tp!.unitRate)
        paymentTicket.discountMoney = Math.floor(tp!.unitDiscountMoney / tp!.unitRate)
        paymentTicket.discountPercent = tp!.discountPercent
        paymentTicket.discountType = tp!.discountType
        paymentTicket.sessionIndex = 0

        paymentTicket.paidMoney = tpContainer.paidMoney
        paymentTicket.debtMoney = 0

        paymentTicket.product = Product.from(tp.product || Product.blank())
        return paymentTicket
      })

    const paymentTicketPrescription: PaymentTicket[] = Object.entries(
      ticketPrescriptionAction.value,
    )
      .filter(([id, tpContainer]) => !!tpContainer && tpContainer.checked)
      .map(([id, tpContainer]) => {
        const tp = tpContainer.data
        const paymentTicket = PaymentTicket.blank()
        paymentTicket.paymentTicketItemType = PaymentTicketItemType.TicketProductPrescription
        paymentTicket.ticketItemId = tp!.id
        paymentTicket.ticketItemInteractId = tp!.productId

        paymentTicket.quantity = tp!.unitQuantity * tp!.unitRate
        paymentTicket.unitRate = tp!.unitRate
        paymentTicket.expectedPrice = Math.floor(tp!.unitExpectedPrice / tp!.unitRate)
        paymentTicket.actualPrice = Math.floor(tp!.unitActualPrice / tp!.unitRate)
        paymentTicket.discountMoney = Math.floor(tp!.unitDiscountMoney / tp!.unitRate)
        paymentTicket.discountPercent = tp!.discountPercent
        paymentTicket.discountType = tp!.discountType
        paymentTicket.sessionIndex = 0

        paymentTicket.paidMoney = tpContainer.paidMoney
        paymentTicket.debtMoney = 0

        paymentTicket.product = Product.from(tp.product || Product.blank())
        return paymentTicket
      })

    const paymentTicketLaboratory: PaymentTicket[] = Object.entries(ticketLaboratoryAction.value)
      .filter(([id, tlContainer]) => !!tlContainer && tlContainer.checked)
      .map(([id, tlContainer]) => {
        const tl = tlContainer.data
        const paymentTicket = PaymentTicket.blank()
        paymentTicket.paymentTicketItemType = PaymentTicketItemType.TicketLaboratory
        paymentTicket.ticketItemId = tl!.id
        paymentTicket.ticketItemInteractId = tl!.laboratoryId

        paymentTicket.expectedPrice = tl!.expectedPrice
        paymentTicket.discountMoney = tl!.discountMoney
        paymentTicket.discountPercent = tl!.discountPercent
        paymentTicket.discountType = tl!.discountType
        paymentTicket.actualPrice = tl!.actualPrice
        paymentTicket.quantity = 1
        paymentTicket.sessionIndex = 0

        paymentTicket.paidMoney = tlContainer.paidMoney
        paymentTicket.debtMoney = 0

        paymentTicket.laboratory = Laboratory.from(tl.laboratory || Laboratory.blank())
        return paymentTicket
      })

    const paymentTicketRadiology: PaymentTicket[] = Object.entries(ticketRadiologyAction.value)
      .filter(([id, trContainer]) => !!trContainer && trContainer.checked)
      .map(([id, trContainer]) => {
        const tr = trContainer.data
        const paymentTicket = PaymentTicket.blank()
        paymentTicket.paymentTicketItemType = PaymentTicketItemType.TicketRadiology
        paymentTicket.ticketItemId = tr!.id
        paymentTicket.ticketItemInteractId = tr!.radiologyId

        paymentTicket.expectedPrice = tr!.expectedPrice
        paymentTicket.discountMoney = tr!.discountMoney
        paymentTicket.discountPercent = tr!.discountPercent
        paymentTicket.discountType = tr!.discountType
        paymentTicket.actualPrice = tr!.actualPrice
        paymentTicket.quantity = 1
        paymentTicket.sessionIndex = 0

        paymentTicket.paidMoney = trContainer.paidMoney
        paymentTicket.debtMoney = 0

        paymentTicket.radiology = Radiology.from(tr.radiology || Radiology.blank())
        return paymentTicket
      })

    paymentTemp.paymentTicketList = [
      ...paymentTicketOther,
      ...paymentTicketRegimen,
      ...paymentTicketProcedureRegimen,
      ...paymentTicketProcedure,
      ...paymentTicketConsumable,
      ...paymentTicketPrescription,
      ...paymentTicketLaboratory,
      ...paymentTicketRadiology,
    ]

    paymentTemp.customer = Customer.from(ticket.value.customer)
    await TemplateHtmlAction.startPrintCustomerPayment({
      payment: paymentTemp,
    })
  } catch (error) {
    console.log('🚀 ~ ModalPrepaymentTicket.vue:380 ~ startPrint ~ error:', error)
  }
}

const disabledButtonSave = computed(() => {
  if (paidTotal.value === 0 && paidItemMoney.value === 0 && paidWait.value === 0) {
    return true
  }
  return false
})

const handleUpdateCheckedTicketRegimen = (checked: boolean, tr: TicketRegimen) => {
  const trContainer = ticketRegimenAction.value[tr.id]

  trContainer.checked = checked
  let paidItemMoney = 0
  Object.values(trContainer.trpCheckbox).forEach((tpContainer) => {
    tpContainer.checked = checked
    if (checked) {
      paidItemMoney += tpContainer.paidMoney
    }
  })
  trContainer.paidItemMoney = paidItemMoney
}

const handleUpdateCheckedTicketProcedureRegimen = (checked: boolean, trp: TicketProcedure) => {
  const trContainer = ticketRegimenAction.value[trp.ticketRegimenId]
  const tpContainer = trContainer.trpCheckbox[trp.id]

  if (checked) {
    trContainer.paidItemMoney += tpContainer.paidMoney
  } else {
    trContainer.paidItemMoney -= tpContainer.paidMoney
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
                  <td colspan="3">
                    <div>Thanh toán vào VÍ (tiền chờ)</div>
                    <div v-if="ticketRef.ticketPaymentDetail?.paidWait">
                      Hiện có: {{ formatMoney(ticketRef.ticketPaymentDetail?.paidWait) }}
                    </div>
                  </td>
                  <td colspan="2">
                    <InputNumber v-model:value="paidWait" textAlign="right" />
                  </td>
                </tr>
              </tbody>
            </template>
            <template
              v-if="
                paymentActionType === PaymentActionType.RefundMoney &&
                ticketRef.ticketPaymentDetail?.paidWait
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
                    {{ formatMoney(ticketRef.ticketPaymentDetail?.paidWait) }})
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
                  <th v-if="[PaymentActionType.RefundMoney].includes(paymentActionType)">
                    Hoàn trả
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(trContainer, trId, index) in ticketRegimenAction" :key="trId">
                  <template v-if="Object.values(trContainer.trpCheckbox).length">
                    <tr>
                      <td v-if="CONFIG.MODE === 'development'" style="text-align: center">
                        <BugDevelopment :data="trContainer" />
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
                          <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
                            <template #trigger>
                              <IconBug
                                style="color: violet; cursor: pointer"
                                width="1.2em"
                                height="1.2em"
                              />
                            </template>
                            <pre>{{ JSON.stringify(trpContainer, null, 4) }}</pre>
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
                          <TicketItemPaymentTypeTooltip
                            :ticketItemPaymentType="trpContainer.data.ticketItemPaymentType"
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
                  <th v-if="[PaymentActionType.RefundMoney].includes(paymentActionType)">
                    Hoàn trả
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(tpContainer, tpId, index) in ticketProcedureNormalAction" :key="tpId">
                  <td v-if="CONFIG.MODE === 'development'" style="text-align: center">
                    <BugDevelopment :data="tpContainer" />
                  </td>
                  <td>
                    <div class="flex justify-center">
                      <InputCheckbox v-model:checked="tpContainer.checked" />
                    </div>
                  </td>
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>
                    <TicketItemPaymentTypeTooltip
                      :ticketItemPaymentType="tpContainer.data.ticketItemPaymentType"
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
                  <th v-if="[PaymentActionType.RefundMoney].includes(paymentActionType)">
                    Hoàn trả
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(tpContainer, tpId, index) in ticketConsumableAction" :key="tpId">
                  <td v-if="CONFIG.MODE === 'development'" style="text-align: center">
                    <BugDevelopment :data="tpContainer" />
                  </td>
                  <td>
                    <div class="flex justify-center">
                      <InputCheckbox v-model:checked="tpContainer.checked" />
                    </div>
                  </td>
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>
                    <TicketItemPaymentTypeTooltip
                      :ticketItemPaymentType="tpContainer.data.ticketItemPaymentType"
                    />
                  </td>
                  <td>{{ tpContainer.data.product?.brandName }}</td>
                  <td class="text-center">{{ tpContainer.data.unitQuantity }}</td>
                  <td class="text-right whitespace-nowrap">
                    <div
                      v-if="tpContainer.data.unitDiscountMoney"
                      class="text-xs italic text-red-500"
                    >
                      <del>{{ formatMoney(tpContainer.data.unitExpectedPrice) }}</del>
                    </div>
                    <div>{{ formatMoney(tpContainer.data.unitActualPrice) }}</div>
                  </td>
                  <td
                    v-if="paymentActionType === PaymentActionType.PaymentMoney"
                    class="text-right"
                  >
                    {{ formatMoney(tpContainer.paidMoney) }}
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
                  <th v-if="[PaymentActionType.RefundMoney].includes(paymentActionType)">
                    Hoàn trả
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(tpContainer, tpId, index) in ticketPrescriptionAction" :key="tpId">
                  <td v-if="CONFIG.MODE === 'development'" style="text-align: center">
                    <BugDevelopment :data="tpContainer" />
                  </td>
                  <td>
                    <div class="flex justify-center">
                      <InputCheckbox v-model:checked="tpContainer.checked" />
                    </div>
                  </td>
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>
                    <TicketItemPaymentTypeTooltip
                      :ticketItemPaymentType="tpContainer.data.ticketItemPaymentType"
                    />
                  </td>
                  <td>{{ tpContainer.data.product?.brandName }}</td>
                  <td class="text-center">{{ tpContainer.data.unitQuantity }}</td>
                  <td class="text-right whitespace-nowrap">
                    <div
                      v-if="tpContainer.data.unitDiscountMoney"
                      class="text-xs italic text-red-500"
                    >
                      <del>{{ formatMoney(tpContainer.data.unitExpectedPrice) }}</del>
                    </div>
                    <div>{{ formatMoney(tpContainer.data.unitActualPrice) }}</div>
                  </td>
                  <td
                    v-if="paymentActionType === PaymentActionType.PaymentMoney"
                    class="text-right"
                  >
                    {{ formatMoney(tpContainer.paidMoney) }}
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
                  <th v-if="[PaymentActionType.RefundMoney].includes(paymentActionType)">
                    Hoàn trả
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(tlContainer, tlId, index) in ticketLaboratoryAction" :key="tlId">
                  <td v-if="CONFIG.MODE === 'development'" style="text-align: center">
                    <BugDevelopment :data="tlContainer" />
                  </td>
                  <td>
                    <div class="flex justify-center">
                      <InputCheckbox v-model:checked="tlContainer.checked" />
                    </div>
                  </td>
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>
                    <TicketItemPaymentTypeTooltip
                      :ticketItemPaymentType="tlContainer.data.ticketItemPaymentType"
                    />
                  </td>
                  <td colspan="3">{{ tlContainer.data.laboratory?.name }}</td>
                  <td
                    v-if="paymentActionType === PaymentActionType.PaymentMoney"
                    class="text-right"
                  >
                    {{ formatMoney(tlContainer.paidMoney) }}
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
                  <th v-if="[PaymentActionType.RefundMoney].includes(paymentActionType)">
                    Hoàn trả
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(trContainer, trId, index) in ticketRadiologyAction" :key="trId">
                  <td v-if="CONFIG.MODE === 'development'" style="text-align: center">
                    <BugDevelopment :data="trContainer" />
                  </td>
                  <td>
                    <div class="flex justify-center">
                      <InputCheckbox v-model:checked="trContainer.checked" />
                    </div>
                  </td>
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>
                    <TicketItemPaymentTypeTooltip
                      :ticketItemPaymentType="trContainer.data.ticketItemPaymentType"
                    />
                  </td>
                  <td colspan="3">{{ trContainer.data.radiology?.name }}</td>
                  <td
                    v-if="paymentActionType === PaymentActionType.PaymentMoney"
                    class="text-right"
                  >
                    {{ formatMoney(trContainer.paidMoney) }}
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
                  <td colspan="3">Chiết khấu</td>
                  <td colspan="1" style="text-align: right">
                    {{ formatMoney(paidDiscountAction.paidMoney) }}
                  </td>
                </tr>
              </template>

              <template v-if="paymentActionType === PaymentActionType.RefundMoney">
                <tr v-if="paidSurchargeAction.paidMoney">
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
                <tr v-if="paidDiscountAction.paidMoney">
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
          </div>
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <template v-if="paymentActionType === PaymentActionType.PaymentMoney">
              <div>Số tiền thanh toán</div>
              <div class="flex">
                <InputMoney ref="inputMoneyPay" :value="paidTotal" textAlign="right" disabled />
              </div>
            </template>
            <template v-if="paymentActionType === PaymentActionType.RefundMoney">
              <div>Số tiền hoàn trả</div>
              <div class="flex">
                <InputMoney ref="inputMoneyPay" :value="-paidTotal" textAlign="right" disabled />
              </div>
            </template>
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
        </VueButton>
      </div>
    </div>
  </VueModal>
</template>
