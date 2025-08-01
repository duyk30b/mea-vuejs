import { BaseModel } from '../_base/base.model'
import { Customer } from '../customer'
import { PaymentMoneyStatus, type DiscountType } from '../enum'
import { Procedure } from '../procedure'
import { Ticket } from '../ticket/ticket.model'

export class TicketProcedure extends BaseModel {
  id: number
  priority: number
  ticketId: number
  customerId: number
  procedureId: number

  paymentMoneyStatus: PaymentMoneyStatus

  quantity: number
  expectedPrice: number // Giá dự kiến
  discountMoney: number // tiền giảm giá
  discountPercent: number // % giảm giá
  discountType: DiscountType // Loại giảm giá
  actualPrice: number // Giá thực tế
  startedAt: number

  customer?: Customer
  ticket?: Ticket
  procedure?: Procedure

  static init(): TicketProcedure {
    const ins = new TicketProcedure()
    ins._localId = Math.random()
    ins.id = 0
    ins.procedureId = 0
    ins.quantity = 0
    ins.expectedPrice = 0
    ins.discountMoney = 0
    ins.discountPercent = 0
    ins.actualPrice = 0
    ins.paymentMoneyStatus = PaymentMoneyStatus.NoEffect
    return ins
  }

  static blank(): TicketProcedure {
    const ins = TicketProcedure.init()
    ins.procedure = Procedure.init()
    return ins
  }

  static basic(source: TicketProcedure) {
    const target = new TicketProcedure()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    target._localId = source.id || source._localId || Math.random()
    return target
  }

  static basicList(sources: TicketProcedure[]): TicketProcedure[] {
    return sources.map((i) => TicketProcedure.basic(i))
  }

  static from(source: TicketProcedure) {
    const target = TicketProcedure.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'procedure')) {
      target.procedure = source.procedure ? Procedure.basic(source.procedure) : source.procedure
    }
    if (Object.prototype.hasOwnProperty.call(source, 'ticket')) {
      target.ticket = source.ticket ? Ticket.basic(source.ticket) : source.ticket
    }
    if (Object.prototype.hasOwnProperty.call(source, 'customer')) {
      target.customer = source.customer ? Customer.basic(source.customer) : source.customer
    }
    return target
  }

  static fromList(sourceList: TicketProcedure[]): TicketProcedure[] {
    return sourceList.map((i) => TicketProcedure.from(i))
  }

  static equal(a: TicketProcedure, b: TicketProcedure) {
    if (a.id != b.id) return false
    if (a.ticketId != b.ticketId) return false
    if (a.customerId != b.customerId) return false
    if (a.procedureId != b.procedureId) return false

    if (a.paymentMoneyStatus != b.paymentMoneyStatus) return false

    if (a.quantity != b.quantity) return false
    if (a.expectedPrice != b.expectedPrice) return false
    if (a.discountMoney != b.discountMoney) return false
    if (a.discountPercent != b.discountPercent) return false
    if (a.discountType != b.discountType) return false
    if (a.actualPrice != b.actualPrice) return false
    if (a.startedAt != b.startedAt) return false
    return true
  }

  static equalList(a: TicketProcedure[], b: TicketProcedure[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!TicketProcedure.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
