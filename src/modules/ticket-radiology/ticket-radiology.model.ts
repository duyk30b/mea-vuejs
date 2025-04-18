import { Customer } from '../customer'
import type { DiscountType } from '../enum'
import { Image } from '../image/image.model'
import { Radiology } from '../radiology'
import { TicketUser } from '../ticket-user'
import { Ticket } from '../ticket/ticket.model'

export enum TicketRadiologyStatus {
  Empty = 1,
  Pending = 2,
  Completed = 3,
}
export class TicketRadiology {
  id: number
  priority: number
  ticketId: number
  customerId: number
  radiologyId: number

  costPrice: number
  expectedPrice: number
  discountMoney: number
  discountPercent: number
  discountType: DiscountType
  actualPrice: number

  description: string
  result: string

  startedAt: number
  status: TicketRadiologyStatus
  imageIds: string

  imageList: Image[]
  radiology?: Radiology
  customer?: Customer
  ticket?: Ticket
  ticketUserList: TicketUser[]

  static init(): TicketRadiology {
    const ins = new TicketRadiology()
    ins.id = 0
    ins.imageIds = '[]'
    ins.description = ''
    return ins
  }

  static blank(): TicketRadiology {
    const ins = TicketRadiology.init()
    ins.imageList = []
    return ins
  }

  static basic(source: TicketRadiology) {
    const target = new TicketRadiology()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
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
    if (source.imageList) {
      target.imageList = Image.basicList(source.imageList)
    }
    if (target.ticketUserList) {
      target.ticketUserList = TicketUser.basicList(target.ticketUserList)
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

    if (a.costPrice != b.costPrice) return false
    if (a.expectedPrice != b.expectedPrice) return false
    if (a.discountMoney != b.discountMoney) return false
    if (a.discountPercent != b.discountPercent) return false
    if (a.discountType != b.discountType) return false
    if (a.actualPrice != b.actualPrice) return false

    if (a.description != b.description) return false
    if (a.result != b.result) return false

    if (a.startedAt != b.startedAt) return false
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
