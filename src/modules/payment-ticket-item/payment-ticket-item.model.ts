import { DiscountType } from '../enum'
import { Payment } from '../payment/payment.model'
import { Ticket } from '../ticket'
import { TicketLaboratory } from '../ticket-laboratory'
import { TicketProcedure } from '../ticket-procedure'
import { TicketProduct } from '../ticket-product'
import { TicketRadiology } from '../ticket-radiology'

export enum TicketItemType {
  Other = 0,
  TicketRegimen = 1,
  TicketProcedure = 2,
  TicketProductConsumable = 3,
  TicketProductPrescription = 4,
  TicketLaboratory = 5,
  TicketRadiology = 6,
}

export class PaymentTicketItem {
  id: string
  paymentId: string
  ticketId: string
  ticketItemType: TicketItemType
  ticketItemId: string
  interactId: number
  sessionIndex: number

  expectedPrice: number
  discountMoney: number
  discountPercent: number
  discountType: DiscountType
  actualPrice: number
  quantity: number

  paidItem: number
  debItem: number

  payment: Payment
  ticket: Ticket
  ticketProcedure: TicketProcedure
  ticketLaboratory: TicketLaboratory
  ticketRadiology: TicketRadiology
  ticketProductConsumable: TicketProduct
  ticketProductPrescription: TicketProduct

  interactName: string // chỉ convert ở front-end để sử dụng cho mục đích in

  static init(): PaymentTicketItem {
    const ins = new PaymentTicketItem()
    ins.id = ''
    ins.paymentId = ''
    ins.ticketId = ''
    ins.ticketItemType = TicketItemType.Other
    ins.ticketItemId = ''
    ins.interactId = 0
    ins.expectedPrice = 0
    ins.discountMoney = 0
    ins.discountPercent = 0
    ins.discountType = DiscountType.Percent
    ins.actualPrice = 0
    ins.quantity = 1
    return ins
  }

  static blank(): PaymentTicketItem {
    const ins = PaymentTicketItem.init()
    return ins
  }

  static basic(source: PaymentTicketItem) {
    const target = new PaymentTicketItem()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: PaymentTicketItem[]): PaymentTicketItem[] {
    return sources.map((i) => PaymentTicketItem.basic(i))
  }

  static from(source: PaymentTicketItem) {
    const target = PaymentTicketItem.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'ticket')) {
      target.ticket = source.ticket ? Ticket.basic(source.ticket) : source.ticket
    }
    if (Object.prototype.hasOwnProperty.call(source, 'payment')) {
      target.payment = source.payment ? Payment.basic(source.payment) : source.payment
    }

    if (Object.prototype.hasOwnProperty.call(source, 'ticketProcedure')) {
      target.ticketProcedure = source.ticketProcedure
        ? TicketProcedure.basic(source.ticketProcedure)
        : source.ticketProcedure
    }
    if (Object.prototype.hasOwnProperty.call(source, 'ticketLaboratory')) {
      target.ticketLaboratory = source.ticketLaboratory
        ? TicketLaboratory.basic(source.ticketLaboratory)
        : source.ticketLaboratory
    }
    if (Object.prototype.hasOwnProperty.call(source, 'ticketRadiology')) {
      target.ticketRadiology = source.ticketRadiology
        ? TicketRadiology.basic(source.ticketRadiology)
        : source.ticketRadiology
    }
    if (Object.prototype.hasOwnProperty.call(source, 'ticketProductConsumable')) {
      target.ticketProductConsumable = source.ticketProductConsumable
        ? TicketProduct.basic(source.ticketProductConsumable)
        : source.ticketProductConsumable
    }
    if (Object.prototype.hasOwnProperty.call(source, 'ticketProductPrescription')) {
      target.ticketProductPrescription = source.ticketProductPrescription
        ? TicketProduct.basic(source.ticketProductPrescription)
        : source.ticketProductPrescription
    }

    return target
  }

  static fromList(roots: PaymentTicketItem[]) {
    return roots.map((i) => PaymentTicketItem.from(i))
  }
}
