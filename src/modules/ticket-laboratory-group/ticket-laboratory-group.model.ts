import { Customer } from '../customer'
import { LaboratoryGroup } from '../laboratory-group'
import { TicketLaboratory } from '../ticket-laboratory/ticket-laboratory.model'
import { Ticket } from '../ticket/ticket.model'

export enum TicketLaboratoryGroupStatus {
  Empty = 1,
  Pending = 2,
  Completed = 3,
}
export class TicketLaboratoryGroup {
  id: number
  ticketId: number
  customerId: number
  laboratoryGroupId: number

  status: TicketLaboratoryGroupStatus
  registeredAt: number | null
  startedAt: number | null
  result: string

  customer?: Customer
  ticket?: Ticket
  laboratoryGroup?: LaboratoryGroup
  ticketLaboratoryList?: TicketLaboratory[]

  static init(): TicketLaboratoryGroup {
    const ins = new TicketLaboratoryGroup()
    ins.id = 0
    ins.laboratoryGroupId = 0
    ins.result = ''
    return ins
  }

  static blank(): TicketLaboratoryGroup {
    const ins = TicketLaboratoryGroup.init()
    return ins
  }

  static basic(source: TicketLaboratoryGroup) {
    const target = new TicketLaboratoryGroup()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: TicketLaboratoryGroup[]): TicketLaboratoryGroup[] {
    return sources.map((i) => TicketLaboratoryGroup.basic(i))
  }

  static from(source: TicketLaboratoryGroup) {
    const target = TicketLaboratoryGroup.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'ticket')) {
      target.ticket = source.ticket ? Ticket.basic(source.ticket) : source.ticket
    }
    if (Object.prototype.hasOwnProperty.call(source, 'customer')) {
      target.customer = source.customer ? Customer.basic(source.customer) : source.customer
    }
    if (Object.prototype.hasOwnProperty.call(source, 'laboratoryGroup')) {
      target.laboratoryGroup = source.laboratoryGroup
        ? LaboratoryGroup.basic(source.laboratoryGroup)
        : source.laboratoryGroup
    }
    if (target.ticketLaboratoryList) {
      target.ticketLaboratoryList = TicketLaboratory.basicList(target.ticketLaboratoryList)
    }
    return target
  }

  static fromList(sourceList: TicketLaboratoryGroup[]): TicketLaboratoryGroup[] {
    return sourceList.map((i) => TicketLaboratoryGroup.from(i))
  }

  static toBasic(root: TicketLaboratoryGroup) {
    const ins = new TicketLaboratoryGroup()
    Object.assign(ins, root)
    return ins
  }

  static toBasics(roots: TicketLaboratoryGroup[]): TicketLaboratoryGroup[] {
    return roots.map((i) => TicketLaboratoryGroup.toBasic(i))
  }

  static equal(a: TicketLaboratoryGroup, b: TicketLaboratoryGroup) {
    if (a.id != b.id) return false
    if (a.ticketId != b.ticketId) return false
    if (a.customerId != b.customerId) return false
    if (a.laboratoryGroupId != b.laboratoryGroupId) return false

    if (a.status != b.status) return false
    if (a.startedAt != b.startedAt) return false
    if (a.result != b.result) return false

    return true
  }

  static equalList(a: TicketLaboratoryGroup[], b: TicketLaboratoryGroup[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!TicketLaboratoryGroup.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
