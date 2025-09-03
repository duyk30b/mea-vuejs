import { BaseModel } from '../_base/base.model'
import { Appointment } from '../appointment'
import { Image } from '../image/image.model'
import { TicketUser } from '../ticket-user'
import { TicketProcedureStatus } from './ticket-procedure.model'

export class TicketProcedureItem extends BaseModel {
  id: number
  ticketId: number
  ticketProcedureId: number
  indexSession: number

  status: TicketProcedureStatus
  registeredAt: number
  completedAt: number
  result: string
  imageIds: string

  appointment: Appointment
  imageList: Image[]
  ticketUserResultList: TicketUser[]

  static init(): TicketProcedureItem {
    const ins = new TicketProcedureItem()
    ins._localId = Math.random().toString(36).substring(2)
    ins.id = 0
    ins.ticketId = 0
    ins.ticketProcedureId = 0

    ins.status = TicketProcedureStatus.Pending
    ins.imageIds = '[]'
    ins.result = ''
    return ins
  }

  static blank(): TicketProcedureItem {
    const ins = TicketProcedureItem.init()
    ins.imageList = []
    return ins
  }

  static basic(source: TicketProcedureItem) {
    const target = new TicketProcedureItem()
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

  static basicList(sources: TicketProcedureItem[]): TicketProcedureItem[] {
    return sources.map((i) => TicketProcedureItem.basic(i))
  }

  static from(source: TicketProcedureItem) {
    const target = TicketProcedureItem.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'appointment')) {
      target.appointment = source.appointment
        ? Appointment.basic(source.appointment)
        : source.appointment
    }
    if (source.imageList) {
      target.imageList = Image.basicList(source.imageList)
    }
    if (source.ticketUserResultList) {
      target.ticketUserResultList = TicketUser.basicList(source.ticketUserResultList)
    }
    return target
  }

  static fromList(sourceList: TicketProcedureItem[]): TicketProcedureItem[] {
    return sourceList.map((i) => TicketProcedureItem.from(i))
  }

  static equal(a: TicketProcedureItem, b: TicketProcedureItem) {
    if (a.id != b.id) return false
    if (a.ticketId != b.ticketId) return false
    if (a.ticketProcedureId != b.ticketProcedureId) return false

    if (a.status != b.status) return false
    if (a.completedAt != b.completedAt) return false
    if (a.result != b.result) return false
    if (a.imageIds != b.imageIds) return false
    return true
  }

  static equalList(a: TicketProcedureItem[], b: TicketProcedureItem[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!TicketProcedureItem.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
