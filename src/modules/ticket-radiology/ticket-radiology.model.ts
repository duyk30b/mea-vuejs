import { BaseModel } from '../_base/base.model'
import { Customer } from '../customer'
import { PaymentMoneyStatus, type DiscountType } from '../enum'
import { Image } from '../image/image.model'
import { Radiology } from '../radiology'
import { Room } from '../room'
import { TicketUser } from '../ticket-user'
import { Ticket } from '../ticket/ticket.model'

export enum TicketRadiologyStatus {
  Empty = 1,
  Pending = 2,
  Completed = 3,
}

export class TicketRadiology extends BaseModel {
  id: number
  priority: number
  ticketId: number
  customerId: number
  roomId: number
  radiologyId: number

  printHtmlId: number
  customVariables: string // Dạng Javascript
  customStyles: string // Dạng Style
  description: string
  result: string

  costPrice: number
  expectedPrice: number
  discountMoney: number
  discountPercent: number
  discountType: DiscountType
  actualPrice: number

  createdAt: number
  completedAt: number
  status: TicketRadiologyStatus
  paymentMoneyStatus: PaymentMoneyStatus
  imageIds: string

  imageList: Image[]
  radiology?: Radiology
  customer?: Customer
  ticket?: Ticket
  ticketUserRequestList: TicketUser[]
  ticketUserResultList: TicketUser[]
  room: Room

  static init(): TicketRadiology {
    const ins = new TicketRadiology()
    ins.id = 0
    ins._localId = Math.random().toString(36).substring(2)

    ins.radiologyId = 0
    ins.paymentMoneyStatus = PaymentMoneyStatus.NoEffect
    ins.printHtmlId = 0
    ins.imageIds = '[]'
    ins.description = ''
    ins.result = ''
    ins.customVariables = ''
    ins.customStyles = ''
    return ins
  }

  static blank(): TicketRadiology {
    const ins = TicketRadiology.init()

    ins.imageList = []
    ins.ticketUserRequestList = []
    ins.ticketUserResultList = []
    return ins
  }

  static basic(source: TicketRadiology) {
    const target = new TicketRadiology()
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

  static basicList(sources: TicketRadiology[]): TicketRadiology[] {
    return sources.map((i) => TicketRadiology.basic(i))
  }

  static from(source: TicketRadiology) {
    const target = TicketRadiology.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'radiology')) {
      target.radiology = source.radiology ? Radiology.basic(source.radiology) : source.radiology
    }
    if (Object.prototype.hasOwnProperty.call(source, 'ticket')) {
      target.ticket = source.ticket ? Ticket.basic(source.ticket) : source.ticket
    }
    if (Object.prototype.hasOwnProperty.call(source, 'customer')) {
      target.customer = source.customer ? Customer.basic(source.customer) : source.customer
    }
    if (Object.prototype.hasOwnProperty.call(source, 'room')) {
      target.room = source.room ? Room.basic(source.room) : source.room
    }

    if (source.imageList) {
      target.imageList = Image.basicList(source.imageList)
    }
    if (target.ticketUserRequestList) {
      target.ticketUserRequestList = TicketUser.basicList(target.ticketUserRequestList)
    }
    if (target.ticketUserResultList) {
      target.ticketUserResultList = TicketUser.basicList(target.ticketUserResultList)
    }
    return target
  }

  static fromList(sourceList: TicketRadiology[]): TicketRadiology[] {
    return sourceList.map((i) => TicketRadiology.from(i))
  }

  static toBasic(root: TicketRadiology) {
    const ins = new TicketRadiology()
    Object.assign(ins, root)
    delete ins.radiology
    return ins
  }

  static toBasics(roots: TicketRadiology[]): TicketRadiology[] {
    return roots.map((i) => TicketRadiology.toBasic(i))
  }

  static equal(a: TicketRadiology, b: TicketRadiology) {
    if (a.id != b.id) return false
    if (a.priority != b.priority) return false
    if (a.ticketId != b.ticketId) return false
    if (a.customerId != b.customerId) return false
    if (a.radiologyId != b.radiologyId) return false

    if (a.printHtmlId != b.printHtmlId) return false
    if (a.customVariables != b.customVariables) return false
    if (a.customStyles != b.customStyles) return false
    if (a.description != b.description) return false
    if (a.result != b.result) return false

    if (a.costPrice != b.costPrice) return false
    if (a.expectedPrice != b.expectedPrice) return false
    if (a.discountMoney != b.discountMoney) return false
    if (a.discountPercent != b.discountPercent) return false
    if (a.discountType != b.discountType) return false
    if (a.actualPrice != b.actualPrice) return false

    if (a.createdAt != b.createdAt) return false
    if (a.completedAt != b.completedAt) return false
    if (a.status != b.status) return false
    if (a.imageIds != b.imageIds) return false
    return true
  }

  static equalList(a: TicketRadiology[], b: TicketRadiology[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!TicketRadiology.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
