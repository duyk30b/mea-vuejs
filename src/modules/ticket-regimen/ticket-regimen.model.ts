import { BaseModel } from '../_base/base.model'
import type { Customer } from '../customer'
import { DiscountType, PaymentMoneyStatus } from '../enum'
import { Procedure } from '../procedure'
import { Regimen } from '../regimen'
import { TicketProcedure } from '../ticket-procedure'
import { TicketUser } from '../ticket-user'
import type { Ticket } from '../ticket/ticket.model'

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
  id: number

  ticketId: number
  customerId: number
  regimenId: number

  expectedPrice: number // Giá dự kiến
  discountMoney: number // tiền giảm giá
  discountPercent: number // % giảm giá
  discountType: DiscountType // Loại giảm giá
  actualPrice: number // Giá thực tế

  costAmount: number
  commissionAmount: number // Giá thực tế

  paymentMoneyStatus: PaymentMoneyStatus
  status: TicketRegimenStatus
  createdAt: number
  completedAt: number

  ticket?: Ticket
  customer?: Customer
  regimen?: Regimen
  ticketProcedureWrapList?: {
    _localId: string
    totalSession: number
    ticketProcedure: TicketProcedure
  }[] // chỉ convert tại front-end
  ticketProcedureList?: TicketProcedure[]
  ticketUserRequestList?: TicketUser[]

  get remainMoney() {
    if (this.paymentMoneyStatus === PaymentMoneyStatus.NoEffect) {
      return 0
    }
    return this.actualPrice
  }

  static init(): TicketRegimen {
    const ins = new TicketRegimen()
    ins._localId = Math.random().toString(36).substring(2)
    ins.id = 0

    ins.ticketId = 0
    ins.customerId = 0
    ins.regimenId = 0

    ins.expectedPrice = 0
    ins.discountMoney = 0
    ins.discountPercent = 0
    ins.discountType = DiscountType.VND
    ins.actualPrice = 0

    ins.paymentMoneyStatus = PaymentMoneyStatus.TicketPaid
    ins.status = TicketRegimenStatus.Pending

    return ins
  }

  static blank(): TicketRegimen {
    const ins = TicketRegimen.init()
    ins.ticketProcedureList = []
    ins.ticketUserRequestList = []
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
    if (source.ticketProcedureList) {
      target.ticketProcedureList = TicketProcedure.basicList(source.ticketProcedureList)
    }
    if (source.ticketUserRequestList) {
      target.ticketUserRequestList = TicketUser.basicList(source.ticketUserRequestList)
    }
    if (source.ticketProcedureWrapList) {
      target.ticketProcedureWrapList = source.ticketProcedureWrapList.map((tpWrap) => {
        const tp = TicketProcedure.basic(tpWrap.ticketProcedure)
        if (tpWrap.ticketProcedure.procedure) {
          tp.procedure = Procedure.basic(tpWrap.ticketProcedure.procedure)
        }
        return {
          _localId: tpWrap._localId,
          totalSession: tpWrap.totalSession,
          ticketProcedure: tp,
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

    if (a.expectedPrice != b.expectedPrice) return false
    if (a.discountMoney != b.discountMoney) return false
    if (a.discountPercent != b.discountPercent) return false
    if (a.discountType != b.discountType) return false
    if (a.actualPrice != b.actualPrice) return false

    if (a.costAmount != b.costAmount) return false
    if (a.commissionAmount != b.commissionAmount) return false

    if (a.paymentMoneyStatus != b.paymentMoneyStatus) return false
    if (a.status != b.status) return false
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

export type TicketRegimenRelationType = {
  [P in keyof Pick<
    TicketRegimen,
    'regimen' | 'ticketProcedureList' | 'ticketUserRequestList'
  >]?: boolean
}

export type TicketRegimenInsertType = Omit<
  TicketRegimen,
  keyof TicketRegimenRelationType | keyof Pick<TicketRegimen, '_localId' | 'id'>
>
