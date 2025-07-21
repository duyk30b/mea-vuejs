import { Customer } from '../customer/customer.model'
import { Distributor } from '../distributor'
import { Payment, type PaymentPersonType } from '../payment/payment.model'
import { Receipt } from '../receipt'
import { Ticket } from '../ticket'
import { TicketLaboratoryGroup } from '../ticket-laboratory-group'
import { TicketProcedure } from '../ticket-procedure'
import { TicketProduct } from '../ticket-product'
import { TicketRadiology } from '../ticket-radiology'
import { User } from '../user'

export enum PaymentVoucherType {
  Other = 0, // Không xác định
  Receipt = 1,
  Ticket = 2,
}

export enum PaymentVoucherItemType {
  Other = 0, // Không xác định
  TicketProcedure = 1,
  TicketProductConsumable = 2,
  TicketProductPrescription = 3,
  TicketLaboratory = 4,
  TicketRadiology = 5,
}

export class PaymentItem {
  id: number
  paymentId: number
  paymentPersonType: PaymentPersonType
  personId: number
  createdAt: number

  voucherType: PaymentVoucherType
  voucherId: number
  voucherItemType: PaymentVoucherItemType
  voucherItemId: number
  paymentInteractId: number

  paidAmount: number // Số tiền thu
  debtAmount: number // Số tiền thu
  openDebt: number // Số tiền thu
  closeDebt: number // Số tiền thu
  cashierId: number
  note: string // Ghi chú

  customer: Customer
  distributor: Distributor
  employee: User
  cashier: User
  ticket: Ticket
  receipt: Receipt
  payment: Payment
  ticketProcedure: TicketProcedure
  ticketLaboratoryGroup: TicketLaboratoryGroup
  ticketRadiology: TicketRadiology
  ticketProductConsumable: TicketProduct
  ticketProductPrescription: TicketProduct

  interactName: string // chỉ convert ở front-end để sử dụng cho mục đích in

  static init(): PaymentItem {
    const ins = new PaymentItem()
    ins.id = 0
    ins.paymentId = 0
    ins.voucherId = 0
    ins.paidAmount = 0
    ins.debtAmount = 0
    ins.openDebt = 0
    ins.closeDebt = 0
    ins.cashierId = 0
    ins.note = ''
    return ins
  }

  static blank(): PaymentItem {
    const ins = PaymentItem.init()
    return ins
  }

  static basic(source: PaymentItem) {
    const target = new PaymentItem()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: PaymentItem[]): PaymentItem[] {
    return sources.map((i) => PaymentItem.basic(i))
  }

  static from(source: PaymentItem) {
    const target = PaymentItem.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'customer')) {
      target.customer = source.customer ? Customer.basic(source.customer) : source.customer
    }
    if (Object.prototype.hasOwnProperty.call(source, 'distributor')) {
      target.distributor = source.distributor
        ? Distributor.basic(source.distributor)
        : source.distributor
    }
    if (Object.prototype.hasOwnProperty.call(source, 'employee')) {
      target.employee = source.employee ? User.basic(source.employee) : source.employee
    }
    if (Object.prototype.hasOwnProperty.call(source, 'cashier')) {
      target.cashier = source.cashier ? User.basic(source.cashier) : source.cashier
    }
    if (Object.prototype.hasOwnProperty.call(source, 'ticket')) {
      target.ticket = source.ticket ? Ticket.basic(source.ticket) : source.ticket
    }
    if (Object.prototype.hasOwnProperty.call(source, 'receipt')) {
      target.receipt = source.receipt ? Receipt.basic(source.receipt) : source.receipt
    }
    if (Object.prototype.hasOwnProperty.call(source, 'payment')) {
      target.payment = source.payment ? Payment.basic(source.payment) : source.payment
    }
    if (Object.prototype.hasOwnProperty.call(source, 'ticketProcedure')) {
      target.ticketProcedure = source.ticketProcedure
        ? TicketProcedure.basic(source.ticketProcedure)
        : source.ticketProcedure
    }
    if (Object.prototype.hasOwnProperty.call(source, 'ticketLaboratoryGroup')) {
      target.ticketLaboratoryGroup = source.ticketLaboratoryGroup
        ? TicketLaboratoryGroup.basic(source.ticketLaboratoryGroup)
        : source.ticketLaboratoryGroup
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

  static fromList(roots: PaymentItem[]) {
    return roots.map((i) => PaymentItem.from(i))
  }
}
