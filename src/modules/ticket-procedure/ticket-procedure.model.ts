import { BaseModel } from '../_base/base.model'
import { Customer } from '../customer'
import { DiscountType, PaymentMoneyStatus } from '../enum'
import { Image } from '../image/image.model'
import { Procedure, ProcedureType } from '../procedure'
import { TicketUser } from '../ticket-user'
import { Ticket } from '../ticket/ticket.model'
import { TicketProcedureItem } from './ticket-procedure-item.model'

export enum TicketProcedureStatus {
  Empty = 1,
  Pending = 2,
  Executing = 3,
  Completed = 4,
  Cancelled = 5,
}

export class TicketProcedure extends BaseModel {
  id: number

  type: ProcedureType
  priority: number
  ticketId: number
  customerId: number
  procedureId: number

  quantity: number
  totalSessions: number
  finishedSessions: number

  expectedPrice: number // Giá dự kiến
  discountMoney: number // tiền giảm giá
  discountPercent: number // % giảm giá
  discountType: DiscountType // Loại giảm giá
  actualPrice: number // Giá thực tế

  paymentMoneyStatus: PaymentMoneyStatus
  status: TicketProcedureStatus
  createdAt: number

  customer?: Customer
  ticket?: Ticket
  procedure?: Procedure

  ticketProcedureItemList?: TicketProcedureItem[]
  ticketUserRequestList?: TicketUser[]

  static init(): TicketProcedure {
    const ins = new TicketProcedure()
    ins._localId = Math.random().toString(36).substring(2)
    ins.id = 0

    ins.priority = 1
    ins.ticketId = 0
    ins.customerId = 0
    ins.procedureId = 0
    ins.type = ProcedureType.Basic

    ins.quantity = 1
    ins.totalSessions = 0

    ins.expectedPrice = 0
    ins.discountMoney = 0
    ins.discountType = DiscountType.Percent
    ins.discountPercent = 0
    ins.actualPrice = 0

    ins.paymentMoneyStatus = PaymentMoneyStatus.NoEffect
    ins.status = TicketProcedureStatus.Pending

    return ins
  }

  static blank(): TicketProcedure {
    const ins = TicketProcedure.init()
    ins.procedure = Procedure.init()
    ins.ticketProcedureItemList = []
    return ins
  }

  static basic(source: TicketProcedure) {
    const target = new TicketProcedure()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    target._localId = String(
      source.id || source._localId || Math.random().toString(36).substring(2),
    )
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
    if (source.ticketProcedureItemList) {
      target.ticketProcedureItemList = TicketProcedureItem.basicList(source.ticketProcedureItemList)
      target.ticketProcedureItemList.forEach((i) => {
        if (i.imageList) {
          i.imageList = Image.basicList(i.imageList)
        }
        if (i.ticketUserResultList) {
          i.ticketUserResultList = TicketUser.basicList(i.ticketUserResultList)
        }
      })
    }
    if (source.ticketUserRequestList) {
      target.ticketUserRequestList = TicketUser.basicList(source.ticketUserRequestList)
    }
    return target
  }

  static fromList(sourceList: TicketProcedure[]): TicketProcedure[] {
    return sourceList.map((i) => TicketProcedure.from(i))
  }

  static equal(a: TicketProcedure, b: TicketProcedure) {
    if (a.id != b.id) return false

    if (a.type != b.type) return false
    if (a.priority != b.priority) return false
    if (a.ticketId != b.ticketId) return false
    if (a.customerId != b.customerId) return false
    if (a.procedureId != b.procedureId) return false

    if (a.quantity != b.quantity) return false
    if (a.totalSessions != b.totalSessions) return false
    if (a.finishedSessions != b.finishedSessions) return false

    if (a.expectedPrice != b.expectedPrice) return false
    if (a.discountMoney != b.discountMoney) return false
    if (a.discountPercent != b.discountPercent) return false
    if (a.discountType != b.discountType) return false
    if (a.actualPrice != b.actualPrice) return false

    if (a.paymentMoneyStatus != b.paymentMoneyStatus) return false
    if (a.status != b.status) return false
    if (a.createdAt != b.createdAt) return false

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
