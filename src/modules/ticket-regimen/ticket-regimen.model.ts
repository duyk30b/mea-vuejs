import { BaseModel } from '../_base/base.model'
import type { Customer } from '../customer'
import { DiscountType } from '../enum'
import { Procedure } from '../procedure'
import { Regimen } from '../regimen'
import { TicketProcedure } from '../ticket-procedure'
import { TicketUser } from '../ticket-user'
import type { Ticket } from '../ticket/ticket.model'
import { TicketRegimenItem } from './ticket-regimen-item.model'

export enum TicketRegimenStatus {
  Empty = 1,
  Pending = 2,
  Executing = 3,
  Completed = 4,
  Cancelled = 5,
}

export const TicketRegimenStatusText = {
  [TicketRegimenStatus.Empty]: 'Trống',
  [TicketRegimenStatus.Pending]: 'Chờ thực hiện',
  [TicketRegimenStatus.Executing]: 'Đang thực hiện',
  [TicketRegimenStatus.Completed]: 'Hoàn thành',
  [TicketRegimenStatus.Cancelled]: 'Hủy',
}

export class TicketRegimen extends BaseModel {
  id: string

  ticketId: string
  customerId: number
  regimenId: number

  status: TicketRegimenStatus
  costAmount: number
  commissionAmount: number // Giá thực tế

  expectedMoney: number // Giá dự kiến
  actualMoney: number // Giá thực tế
  spentMoney: number // Tiền đã dùng
  remainingMoney: number // Tiền còn lại, chi dùng trong trường hợp thanh toán lẻ

  discountMoney: number // tiền giảm giá
  discountPercent: number // % giảm giá
  discountType: DiscountType // Loại giảm giá

  createdAt: number
  completedAt: number

  ticketCreated?: Ticket
  customer?: Customer
  regimen?: Regimen

  ticketUserRequestList?: TicketUser[]
  ticketRegimenItemList?: TicketRegimenItem[]
  ticketProcedureList?: TicketProcedure[]
  ticketProcedureSessionMap: Record<string, TicketProcedure[]>

  static init(): TicketRegimen {
    const ins = new TicketRegimen()
    ins._localId = Math.random().toString(36).substring(2)
    ins.id = ''

    ins.ticketId = ''
    ins.customerId = 0
    ins.regimenId = 0

    ins.status = TicketRegimenStatus.Pending

    ins.expectedMoney = 0
    ins.actualMoney = 0
    ins.spentMoney = 0
    ins.remainingMoney = 0
    ins.discountMoney = 0
    ins.discountPercent = 0
    ins.discountType = DiscountType.VND

    return ins
  }

  static blank(): TicketRegimen {
    const ins = TicketRegimen.init()

    ins.ticketUserRequestList = []
    ins.ticketRegimenItemList = []
    ins.ticketProcedureList = []

    return ins
  }

  static basic(source: TicketRegimen) {
    const target = new TicketRegimen()
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

  static basicList(sources: TicketRegimen[]): TicketRegimen[] {
    return sources.map((i) => TicketRegimen.basic(i))
  }

  static from(source: TicketRegimen) {
    const target = TicketRegimen.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'regimen')) {
      target.regimen = source.regimen ? Regimen.basic(source.regimen) : source.regimen
    }

    if (source.ticketUserRequestList) {
      target.ticketUserRequestList = TicketUser.basicList(source.ticketUserRequestList)
    }

    if (source.ticketProcedureList) {
      target.ticketProcedureList = TicketProcedure.basicList(source.ticketProcedureList)
      target.ticketProcedureList.forEach((tp) => {
        if (tp.procedure) {
          tp.procedure = Procedure.basic(tp.procedure)
        }
      })
    }

    if (source.ticketRegimenItemList) {
      target.ticketRegimenItemList = TicketRegimenItem.basicList(source.ticketRegimenItemList)
      target.ticketRegimenItemList.forEach((tri) => {
        if (tri.procedure) {
          tri.procedure = Procedure.basic(tri.procedure)
        }
      })
    }
    return target
  }

  static fromList(sourceList: TicketRegimen[]): TicketRegimen[] {
    return sourceList.map((i) => TicketRegimen.from(i))
  }

  static equal(a: TicketRegimen, b: TicketRegimen) {
    if (a.id != b.id) return false

    if (a.ticketId != b.ticketId) return false
    if (a.customerId != b.customerId) return false
    if (a.regimenId != b.regimenId) return false

    if (a.status != b.status) return false
    if (a.costAmount != b.costAmount) return false
    if (a.commissionAmount != b.commissionAmount) return false

    if (a.expectedMoney != b.expectedMoney) return false
    if (a.actualMoney != b.actualMoney) return false
    if (a.spentMoney != b.spentMoney) return false
    if (a.remainingMoney != b.remainingMoney) return false
    if (a.discountMoney != b.discountMoney) return false
    if (a.discountPercent != b.discountPercent) return false
    if (a.discountType != b.discountType) return false

    if (a.createdAt != b.createdAt) return false
    if (a.completedAt != b.completedAt) return false

    return true
  }

  static equalList(a: TicketRegimen[], b: TicketRegimen[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!TicketRegimen.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
