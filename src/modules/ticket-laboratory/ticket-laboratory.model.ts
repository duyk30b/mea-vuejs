import { Customer } from '../customer'
import type { DiscountType } from '../enum'
import { Laboratory } from '../laboratory'
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

  costPrice: number
  expectedPrice: number
  discountMoney: number
  discountPercent: number
  discountType: DiscountType
  actualPrice: number

  result: string
  attention: string

  status: TicketLaboratoryStatus
  startedAt: number | null

  resultParse: Record<string, any> // chỉ dùng ở front-end
  attentionParse: Record<string, any> // chỉ dùng ở front-end

  customer?: Customer
  ticket?: Ticket
  ticketUserList: TicketUser[]
  laboratory?: Laboratory
  laboratoryList?: Laboratory[]

  static init(): TicketLaboratory {
    const ins = new TicketLaboratory()
    ins.id = 0
    ins.result = JSON.stringify({})
    ins.attention = JSON.stringify({})
    ins.resultParse = {}
    ins.attentionParse = {}
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
    try {
      target.resultParse = JSON.parse(target.result)
    } catch (error) {
      target.resultParse = {}
    }
    try {
      target.attentionParse = JSON.parse(target.attention)
    } catch (error) {
      target.attentionParse = {}
    }
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
    if (target.ticketUserList) {
      target.ticketUserList = TicketUser.basicList(target.ticketUserList)
    }
    if (target.laboratory) {
      target.laboratory = Laboratory.basic(target.laboratory)
    }
    if (target.laboratoryList) {
      target.laboratoryList = Laboratory.basicList(target.laboratoryList)
    }
    try {
      target.resultParse = JSON.parse(source.result)
    } catch (error) {
      target.resultParse = {}
    }
    try {
      target.attentionParse = JSON.parse(source.attention)
    } catch (error) {
      target.attentionParse = {}
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

    if (a.attention != b.attention) return false
    if (a.result != b.result) return false

    if (a.startedAt != b.startedAt) return false
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
