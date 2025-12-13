import { BaseModel } from '../_base/base.model'
import { Customer } from '../customer'
import { DiscountType, PaymentMoneyStatus } from '../enum'
import { Image } from '../image/image.model'
import { Procedure } from '../procedure'
import { TicketProduct } from '../ticket-product'
import type { TicketRegimen } from '../ticket-regimen'
import { TicketUser } from '../ticket-user'
import { Ticket } from '../ticket/ticket.model'

export enum TicketProcedureStatus {
  NoEffect = -1,
  NoAction = 1,
  Pending = 2,
  Completed = 3,
}

export enum TicketProcedureType {
  Normal = 1,
  InRegimen = 2,
}

export class TicketProcedure extends BaseModel {
  id: string
  priority: number
  ticketProcedureType: TicketProcedureType

  ticketId: string
  customerId: number
  procedureId: number
  ticketRegimenId: string
  ticketRegimenItemId: string
  indexSession: number

  quantity: number

  expectedPrice: number // Giá dự kiến
  discountMoney: number // tiền giảm giá
  discountPercent: number // % giảm giá
  discountType: DiscountType // Loại giảm giá
  actualPrice: number // Giá thực tế

  status: TicketProcedureStatus
  paymentMoneyStatus: PaymentMoneyStatus
  paid: number
  debt: number

  createdAt: number
  completedAt: number
  result: string
  imageIds: string

  costAmount: number
  commissionAmount: number

  customer?: Customer
  ticket?: Ticket
  procedure?: Procedure

  ticketRegimen: TicketRegimen
  imageList: Image[]
  ticketUserRequestList?: TicketUser[]
  ticketUserResultList?: TicketUser[]
  ticketProductProcedureList?: TicketProduct[]

  static init(): TicketProcedure {
    const ins = new TicketProcedure()
    ins._localId = Math.random().toString(36).substring(2)
    ins.id = ''

    ins.priority = 1
    ins.ticketId = ''
    ins.customerId = 0
    ins.procedureId = 0
    ins.ticketRegimenId = ''

    ins.quantity = 1

    ins.expectedPrice = 0
    ins.discountMoney = 0
    ins.discountType = DiscountType.Percent
    ins.discountPercent = 0
    ins.actualPrice = 0

    ins.paymentMoneyStatus = PaymentMoneyStatus.TicketPaid
    ins.status = TicketProcedureStatus.NoAction
    ins.paid = 0
    ins.debt = 0

    return ins
  }

  static blank(): TicketProcedure {
    const ins = TicketProcedure.init()
    ins.procedure = Procedure.init()
    ins.imageList = []
    ins.ticketUserRequestList = []
    ins.ticketUserResultList = []
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
    if (source.imageList) {
      target.imageList = Image.basicList(source.imageList)
    }
    if (source.ticketUserRequestList) {
      target.ticketUserRequestList = TicketUser.basicList(source.ticketUserRequestList)
    }
    if (source.ticketUserResultList) {
      target.ticketUserResultList = TicketUser.basicList(source.ticketUserResultList)
    }
    if (source.ticketProductProcedureList) {
      target.ticketProductProcedureList = TicketProduct.basicList(source.ticketProductProcedureList)
    }
    return target
  }

  static fromList(sourceList: TicketProcedure[]): TicketProcedure[] {
    return sourceList.map((i) => TicketProcedure.from(i))
  }

  static equal(a: TicketProcedure, b: TicketProcedure) {
    if (a.id != b.id) return false
    if (a.priority != b.priority) return false
    if (a.ticketProcedureType != b.ticketProcedureType) return false

    if (a.ticketId != b.ticketId) return false
    if (a.customerId != b.customerId) return false
    if (a.procedureId != b.procedureId) return false
    if (a.ticketRegimenId != b.ticketRegimenId) return false

    if (a.quantity != b.quantity) return false

    if (a.expectedPrice != b.expectedPrice) return false
    if (a.discountMoney != b.discountMoney) return false
    if (a.discountPercent != b.discountPercent) return false
    if (a.discountType != b.discountType) return false
    if (a.actualPrice != b.actualPrice) return false

    if (a.status != b.status) return false
    if (a.paymentMoneyStatus != b.paymentMoneyStatus) return false
    if (a.paid != b.paid) return false
    if (a.debt != b.debt) return false

    if (a.createdAt != b.createdAt) return false
    if (a.completedAt != b.completedAt) return false
    if (a.result != b.result) return false
    if (a.imageIds != b.imageIds) return false

    if (a.costAmount != b.costAmount) return false
    if (a.commissionAmount != b.commissionAmount) return false
    if (a.indexSession != b.indexSession) return false

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
