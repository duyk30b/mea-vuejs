import { Customer } from '../customer'
import { Laboratory } from '../laboratory'
import { Ticket } from '../ticket/ticket.model'

export class TicketLaboratoryResult {
  id: number
  ticketId: number
  customerId: number
  laboratoryId: number
  ticketLaboratoryId: number
  ticketLaboratoryGroupId: number

  result: string
  attention: number

  customer?: Customer
  ticket?: Ticket
  laboratory?: Laboratory

  static init(): TicketLaboratoryResult {
    const ins = new TicketLaboratoryResult()
    ins.id = 0
    return ins
  }

  static blank(): TicketLaboratoryResult {
    const ins = TicketLaboratoryResult.init()
    ins.result = ''
    ins.attention = 0
    return ins
  }

  static basic(source: TicketLaboratoryResult) {
    const target = new TicketLaboratoryResult()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: TicketLaboratoryResult[]): TicketLaboratoryResult[] {
    return sources.map((i) => TicketLaboratoryResult.basic(i))
  }

  static from(source: TicketLaboratoryResult) {
    const target = TicketLaboratoryResult.basic(source)
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
    return target
  }

  static fromList(sourceList: TicketLaboratoryResult[]): TicketLaboratoryResult[] {
    return sourceList.map((i) => TicketLaboratoryResult.from(i))
  }

  static toBasic(root: TicketLaboratoryResult) {
    const ins = new TicketLaboratoryResult()
    Object.assign(ins, root)
    return ins
  }

  static toBasics(roots: TicketLaboratoryResult[]): TicketLaboratoryResult[] {
    return roots.map((i) => TicketLaboratoryResult.toBasic(i))
  }

  static equal(a: TicketLaboratoryResult, b: TicketLaboratoryResult) {
    if (a.id != b.id) return false
    if (a.ticketId != b.ticketId) return false
    if (a.customerId != b.customerId) return false
    if (a.laboratoryId != b.laboratoryId) return false
    if (a.ticketLaboratoryId != b.ticketLaboratoryId) return false
    if (a.ticketLaboratoryGroupId != b.ticketLaboratoryGroupId) return false

    if (a.result != b.result) return false
    if (a.attention != b.attention) return false
    return true
  }

  static equalList(a: TicketLaboratoryResult[], b: TicketLaboratoryResult[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!TicketLaboratoryResult.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
