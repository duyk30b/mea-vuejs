import { DiscountType } from '../enum'
import { Laboratory } from '../laboratory'
import { Payment } from '../payment/payment.model'
import { Procedure } from '../procedure'
import { Product } from '../product'
import { Radiology } from '../radiology'
import { Regimen } from '../regimen'
import { Ticket } from '../ticket'
import type { TicketActionType } from '../ticket/ticket.type'

export enum PaymentTicketItemType {
  Unknown = 0, // Không xác định
  WAIT = 1, // Thanh toán vào tiền chờ
  Surcharge = 2,
  Discount = 3,
  TicketRegimen = 4,
  TicketProcedure = 5,
  TicketProductConsumable = 6,
  TicketProductPrescription = 7,
  TicketLaboratory = 8,
  TicketRadiology = 9,
}

export class PaymentTicket {
  id: string
  paymentId: string
  ticketId: string
  ticketActionType: TicketActionType
  paymentTicketItemType: PaymentTicketItemType
  ticketItemId: string
  ticketItemInteractId: number
  sessionIndex: number

  expectedPrice: number
  discountType: DiscountType
  discountMoney: number
  discountPercent: number
  actualPrice: number
  quantity: number
  unitRate: number

  paidMoney: number
  debtMoney: number

  createdAt: number

  payment: Payment
  ticket: Ticket
  regimen: Regimen
  procedure: Procedure
  product: Product
  laboratory: Laboratory
  radiology: Radiology

  static init(): PaymentTicket {
    const ins = new PaymentTicket()
    ins.id = ''
    ins.paymentId = ''
    ins.ticketId = ''
    ins.paymentTicketItemType = PaymentTicketItemType.WAIT
    ins.ticketItemId = ''
    ins.ticketItemInteractId = 0
    ins.expectedPrice = 0
    ins.discountMoney = 0
    ins.discountPercent = 0
    ins.discountType = DiscountType.Percent
    ins.actualPrice = 0
    ins.quantity = 1

    ins.paidMoney = 0
    ins.debtMoney = 0

    return ins
  }

  get interactName() {
    if (this.paymentTicketItemType === PaymentTicketItemType.Unknown) {
      return 'Tiền chờ'
    }
    if (this.paymentTicketItemType === PaymentTicketItemType.WAIT) {
      return 'Tiền chờ'
    }
    if (this.paymentTicketItemType === PaymentTicketItemType.Surcharge) {
      return 'Phụ phí'
    }
    if (this.paymentTicketItemType === PaymentTicketItemType.Discount) {
      return 'Chiết khấu'
    }
    if (this.paymentTicketItemType === PaymentTicketItemType.TicketRegimen) {
      return this.regimen?.name || ''
    }
    if (this.paymentTicketItemType === PaymentTicketItemType.TicketProcedure) {
      return this.procedure?.name || ''
    }
    if (this.paymentTicketItemType === PaymentTicketItemType.TicketProductConsumable) {
      return this.product?.brandName || ''
    }
    if (this.paymentTicketItemType === PaymentTicketItemType.TicketProductPrescription) {
      return this.product?.brandName || ''
    }
    if (this.paymentTicketItemType === PaymentTicketItemType.TicketLaboratory) {
      return this.laboratory?.name || ''
    }
    if (this.paymentTicketItemType === PaymentTicketItemType.TicketRadiology) {
      return this.radiology?.name || ''
    }

    return ''
  }

  static blank(): PaymentTicket {
    const ins = PaymentTicket.init()
    return ins
  }

  static basic(source: PaymentTicket) {
    const target = new PaymentTicket()
    Object.keys(source).forEach((key: any) => {
      const value = source[key as keyof typeof source]
      if (value !== undefined) {
        ; (target as any)[key] = value
      }
    })
    return target
  }

  static basicList(sources: PaymentTicket[]): PaymentTicket[] {
    return sources.map((i) => PaymentTicket.basic(i))
  }

  static from(source: PaymentTicket) {
    const target = PaymentTicket.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'payment')) {
      target.payment = source.payment ? Payment.basic(source.payment) : source.payment
    }
    if (Object.prototype.hasOwnProperty.call(source, 'ticket')) {
      target.ticket = source.ticket ? Ticket.basic(source.ticket) : source.ticket
    }
    if (Object.prototype.hasOwnProperty.call(source, 'procedure')) {
      target.procedure = source.procedure ? Procedure.basic(source.procedure) : source.procedure
    }
    if (Object.prototype.hasOwnProperty.call(source, 'product')) {
      target.product = source.product ? Product.basic(source.product) : source.product
    }
    if (Object.prototype.hasOwnProperty.call(source, 'laboratory')) {
      target.laboratory = source.laboratory
        ? Laboratory.basic(source.laboratory)
        : source.laboratory
    }
    if (Object.prototype.hasOwnProperty.call(source, 'radiology')) {
      target.radiology = source.radiology ? Radiology.basic(source.radiology) : source.radiology
    }
    return target
  }

  static fromList(roots: PaymentTicket[]) {
    return roots.map((i) => PaymentTicket.from(i))
  }
}
