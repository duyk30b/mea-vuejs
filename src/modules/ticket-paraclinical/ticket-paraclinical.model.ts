import { Customer } from '../customer'
import type { DiscountType } from '../enum'
import { Image } from '../image/image.model'
import { Paraclinical } from '../paraclinical'
import { TicketUser } from '../ticket-user'
import { Ticket } from '../ticket/ticket.model'

export class TicketParaclinical {
  id: number
  ticketId: number
  customerId: number
  paraclinicalId: number
  expectedPrice: number
  discountMoney: number
  discountPercent: number
  discountType: DiscountType
  actualPrice: number

  description: string
  result: string
  
  startedAt: number
  imageIds: string

  imageList: Image[]
  paraclinical?: Paraclinical
  customer?: Customer
  ticket?: Ticket
  ticketUserList: TicketUser[]

  static init(): TicketParaclinical {
    const ins = new TicketParaclinical()
    ins.id = 0
    ins.imageIds = '[]'
    return ins
  }

  static blank(): TicketParaclinical {
    const ins = TicketParaclinical.init()
    ins.imageList = []
    return ins
  }

  static basic(source: TicketParaclinical) {
    const target = new TicketParaclinical()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: TicketParaclinical[]): TicketParaclinical[] {
    return sources.map((i) => TicketParaclinical.basic(i))
  }

  static from(source: TicketParaclinical) {
    const target = TicketParaclinical.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'paraclinical')) {
      target.paraclinical = source.paraclinical ? Paraclinical.basic(source.paraclinical) : source.paraclinical
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

  static fromList(sourceList: TicketParaclinical[]): TicketParaclinical[] {
    return sourceList.map((i) => TicketParaclinical.from(i))
  }

  static toBasic(root: TicketParaclinical) {
    const ins = new TicketParaclinical()
    Object.assign(ins, root)
    delete ins.paraclinical
    return ins
  }

  static toBasics(roots: TicketParaclinical[]): TicketParaclinical[] {
    return roots.map((i) => TicketParaclinical.toBasic(i))
  }

  static equal(a: TicketParaclinical, b: TicketParaclinical) {
    if (a.id != b.id) return false
    if (a.ticketId != b.ticketId) return false
    if (a.customerId != b.customerId) return false
    if (a.paraclinicalId != b.paraclinicalId) return false
    if (a.expectedPrice != b.expectedPrice) return false
    if (a.discountMoney != b.discountMoney) return false
    if (a.discountPercent != b.discountPercent) return false
    if (a.discountType != b.discountType) return false
    if (a.actualPrice != b.actualPrice) return false
    if (a.description != b.description) return false
    if (a.startedAt != b.startedAt) return false
    if (a.imageIds != b.imageIds) return false
    return true
  }

  static equalList(a: TicketParaclinical[], b: TicketParaclinical[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!TicketParaclinical.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
