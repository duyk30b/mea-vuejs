import { BaseModel } from '../_base/base.model'
import { Image } from '../image/image.model'
import { TicketProcedureStatus } from './ticket-procedure.model'

export class TicketProcedureItem extends BaseModel {
  id: number
  ticketId: number
  ticketProcedureId: number

  status: TicketProcedureStatus
  completedAt: number
  result: string
  imageIds: string

  imageList: Image[]

  static init(): TicketProcedureItem {
    const ins = new TicketProcedureItem()
    ins._localId = Math.random()
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
    target._localId = source.id || source._localId || Math.random()
    return target
  }

  static basicList(sources: TicketProcedureItem[]): TicketProcedureItem[] {
    return sources.map((i) => TicketProcedureItem.basic(i))
  }

  static from(source: TicketProcedureItem) {
    const target = TicketProcedureItem.basic(source)
    if (source.imageList) {
      target.imageList = Image.basicList(source.imageList)
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
