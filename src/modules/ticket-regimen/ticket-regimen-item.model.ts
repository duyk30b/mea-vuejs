import { BaseModel } from '../_base/base.model'
import { DiscountType, PaymentMoneyStatus } from '../enum'
import { Procedure } from '../procedure'
import type { TicketProcedure } from '../ticket-procedure'

export class TicketRegimenItem extends BaseModel {
  id: string

  ticketId: string
  customerId: number
  regimenId: number
  procedureId: number
  ticketRegimenId: string

  gapDay: number
  quantityRegular: number
  quantityActual: number
  quantityUsed: number

  moneyAmountRegular: number
  moneyAmountSale: number
  moneyAmountUsed: number
  moneyAmountActual: number

  discountMoneyAmount: number
  discountPercent: number // % giảm giá
  discountType: DiscountType // Loại giảm giá

  procedure?: Procedure
  ticketProcedureList?: TicketProcedure[]

  static init(): TicketRegimenItem {
    const ins = new TicketRegimenItem()
    ins._localId = Math.random().toString(36).substring(2)
    ins.id = ''

    ins.ticketId = ''
    ins.customerId = 0
    ins.regimenId = 0
    ins.procedureId = 0
    ins.ticketRegimenId = ''

    ins.gapDay = 1
    ins.quantityRegular = 0
    ins.quantityActual = 0
    ins.quantityUsed = 0

    ins.moneyAmountRegular = 0
    ins.moneyAmountSale = 0
    ins.moneyAmountActual = 0
    ins.moneyAmountUsed = 0

    ins.discountMoneyAmount = 0
    ins.discountPercent = 0
    ins.discountType = DiscountType.VND

    return ins
  }

  static blank(): TicketRegimenItem {
    const ins = TicketRegimenItem.init()
    ins.ticketProcedureList = []
    return ins
  }

  static basic(source: TicketRegimenItem) {
    const target = new TicketRegimenItem()
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

  static basicList(sources: TicketRegimenItem[]): TicketRegimenItem[] {
    return sources.map((i) => TicketRegimenItem.basic(i))
  }

  static from(source: TicketRegimenItem) {
    const target = TicketRegimenItem.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'procedure')) {
      target.procedure = source.procedure ? Procedure.basic(source.procedure) : source.procedure
    }

    return target
  }

  static fromList(sourceList: TicketRegimenItem[]): TicketRegimenItem[] {
    return sourceList.map((i) => TicketRegimenItem.from(i))
  }

  static equal(a: TicketRegimenItem, b: TicketRegimenItem) {
    if (a.id != b.id) return false

    if (a.ticketId != b.ticketId) return false
    if (a.customerId != b.customerId) return false
    if (a.regimenId != b.regimenId) return false
    if (a.procedureId != b.procedureId) return false
    if (a.ticketRegimenId != b.ticketRegimenId) return false

    if (a.gapDay != b.gapDay) return false
    if (a.quantityRegular != b.quantityRegular) return false
    if (a.quantityActual != b.quantityActual) return false
    if (a.quantityUsed != b.quantityUsed) return false

    if (a.moneyAmountRegular != b.moneyAmountRegular) return false
    if (a.moneyAmountSale != b.moneyAmountSale) return false
    if (a.moneyAmountActual != b.moneyAmountActual) return false
    if (a.moneyAmountUsed != b.moneyAmountUsed) return false

    if (a.discountMoneyAmount != b.discountMoneyAmount) return false
    if (a.discountPercent != b.discountPercent) return false
    if (a.discountType != b.discountType) return false

    return true
  }

  static equalList(a: TicketRegimenItem[], b: TicketRegimenItem[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!TicketRegimenItem.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
