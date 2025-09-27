import { BaseModel } from '../_base/base.model'
import { Customer } from '../customer'
import { CustomerSource } from '../customer-source'
import { Ticket } from '../ticket'

export class TicketReception extends BaseModel {
  id: string

  ticketId: string
  roomId: number
  customerId: number
  customerSourceId: number

  isFirstReception: number
  receptionAt: number
  reason: string

  customer?: Customer
  customerSource?: CustomerSource
  ticket?: Ticket

  static init(): TicketReception {
    const ins = new TicketReception()
    ins._localId = Math.random().toString(36).substring(2)
    ins.id = ''

    ins.ticketId = ''
    ins.roomId = 0
    ins.customerId = 0
    ins.customerSourceId = 0

    ins.isFirstReception = 1
    ins.reason = ''

    return ins
  }

  static blank(): TicketReception {
    const ins = TicketReception.init()
    return ins
  }

  static basic(source: TicketReception) {
    const target = new TicketReception()
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

  static basicList(sources: TicketReception[]): TicketReception[] {
    return sources.map((i) => TicketReception.basic(i))
  }

  static from(source: TicketReception) {
    const target = TicketReception.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'customer')) {
      target.customer = source.customer ? Customer.basic(source.customer) : source.customer
    }
    if (Object.prototype.hasOwnProperty.call(source, 'ticket')) {
      target.ticket = source.ticket ? Ticket.basic(source.ticket) : source.ticket
    }
    if (Object.prototype.hasOwnProperty.call(source, 'customerSource')) {
      target.customerSource = source.customerSource
        ? CustomerSource.basic(source.customerSource)
        : source.customerSource
    }

    return target
  }

  static fromList(sourceList: TicketReception[]): TicketReception[] {
    return sourceList.map((i) => TicketReception.from(i))
  }

  static equal(a: TicketReception, b: TicketReception) {
    if (a.id != b.id) return false

    if (a.ticketId != b.ticketId) return false
    if (a.roomId != b.roomId) return false
    if (a.customerId != b.customerId) return false
    if (a.customerSourceId != b.customerSourceId) return false

    if (a.receptionAt != b.receptionAt) return false
    if (a.reason != b.reason) return false

    return true
  }

  static equalList(a: TicketReception[], b: TicketReception[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!TicketReception.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
