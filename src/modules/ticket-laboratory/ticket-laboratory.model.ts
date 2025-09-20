import { Customer } from '../customer'
import { PaymentMoneyStatus, type DiscountType } from '../enum'
import { Laboratory } from '../laboratory'
import { Room } from '../room'
import { TicketUser } from '../ticket-user'
import { Ticket } from '../ticket/ticket.model'

export enum TicketLaboratoryStatus {
  Empty = 1,
  Pending = 2,
  Completed = 3,
}
export class TicketLaboratory {
  id: number
  priority: number
  ticketId: number
  customerId: number
  laboratoryId: number
  roomId: number
  laboratoryGroupId: number
  ticketLaboratoryGroupId: number

  costPrice: number
  expectedPrice: number
  discountMoney: number
  discountPercent: number
  discountType: DiscountType
  actualPrice: number

  status: TicketLaboratoryStatus
  paymentMoneyStatus: PaymentMoneyStatus

  createdAt: number
  completedAt: number | null

  customer?: Customer
  ticket?: Ticket
  ticketUserList: TicketUser[]
  laboratory?: Laboratory
  room?: Room

  static init(): TicketLaboratory {
    const ins = new TicketLaboratory()
    ins.id = 0
    ins.paymentMoneyStatus = PaymentMoneyStatus.TicketPaid
    return ins
  }

  static blank(): TicketLaboratory {
    const ins = TicketLaboratory.init()
    return ins
  }

  static basic(source: TicketLaboratory) {
    const target = new TicketLaboratory()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: TicketLaboratory[]): TicketLaboratory[] {
    return sources.map((i) => TicketLaboratory.basic(i))
  }

  static from(source: TicketLaboratory) {
    const target = TicketLaboratory.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'ticket')) {
      target.ticket = source.ticket ? Ticket.basic(source.ticket) : source.ticket
    }
    if (Object.prototype.hasOwnProperty.call(source, 'customer')) {
      target.customer = source.customer ? Customer.basic(source.customer) : source.customer
    }
    if (Object.prototype.hasOwnProperty.call(source, 'laboratory')) {
      target.laboratory = source.laboratory
        ? Laboratory.basic(source.laboratory)
        : source.laboratory
    }
    if (Object.prototype.hasOwnProperty.call(source, 'room')) {
      target.room = source.room ? Room.basic(source.room) : source.room
    }

    if (target.ticketUserList) {
      target.ticketUserList = TicketUser.basicList(target.ticketUserList)
    }
    return target
  }

  static fromList(sourceList: TicketLaboratory[]): TicketLaboratory[] {
    return sourceList.map((i) => TicketLaboratory.from(i))
  }

  static toBasic(root: TicketLaboratory) {
    const ins = new TicketLaboratory()
    Object.assign(ins, root)
    return ins
  }

  static toBasics(roots: TicketLaboratory[]): TicketLaboratory[] {
    return roots.map((i) => TicketLaboratory.toBasic(i))
  }

  static equal(a: TicketLaboratory, b: TicketLaboratory) {
    if (a.id != b.id) return false
    if (a.priority != b.priority) return false
    if (a.ticketId != b.ticketId) return false
    if (a.customerId != b.customerId) return false
    if (a.laboratoryId != b.laboratoryId) return false

    if (a.expectedPrice != b.expectedPrice) return false
    if (a.discountMoney != b.discountMoney) return false
    if (a.discountPercent != b.discountPercent) return false
    if (a.discountType != b.discountType) return false
    if (a.actualPrice != b.actualPrice) return false

    if (a.status != b.status) return false

    if (a.createdAt != b.createdAt) return false
    if (a.completedAt != b.completedAt) return false
    return true
  }

  static equalList(a: TicketLaboratory[], b: TicketLaboratory[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!TicketLaboratory.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
