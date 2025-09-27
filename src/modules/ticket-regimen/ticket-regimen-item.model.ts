import { BaseModel } from '../_base/base.model'
import { DiscountType, PaymentEffect, PaymentMoneyStatus } from '../enum'
import { Procedure } from '../procedure'

export class TicketRegimenItem extends BaseModel {
  id: string

  ticketId: string
  customerId: number
  regimenId: number
  procedureId: number
  ticketRegimenId: string

  quantityTotal: number
  quantityFinish: number
  gapDay: number

  expectedPrice: number // Giá dự kiến
  discountMoney: number // tiền giảm giá
  discountPercent: number // % giảm giá
  discountType: DiscountType // Loại giảm giá
  actualPrice: number // Giá thực tế

  procedure?: Procedure

  static init(): TicketRegimenItem {
    const ins = new TicketRegimenItem()
    ins._localId = Math.random().toString(36).substring(2)
    ins.id = ''

    ins.ticketId = ''
    ins.customerId = 0
    ins.regimenId = 0
    ins.procedureId = 0
    ins.ticketRegimenId = ''

    ins.quantityTotal = 0
    ins.quantityFinish = 0
    ins.gapDay = 1

    ins.expectedPrice = 0
    ins.discountMoney = 0
    ins.discountPercent = 0
    ins.discountType = DiscountType.VND
    ins.actualPrice = 0

    return ins
  }

  static blank(): TicketRegimenItem {
    const ins = TicketRegimenItem.init()
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
    if (a.ticketRegimenId != b.ticketRegimenId) return false
    if (a.procedureId != b.procedureId) return false

    if (a.expectedPrice != b.expectedPrice) return false
    if (a.discountMoney != b.discountMoney) return false
    if (a.discountPercent != b.discountPercent) return false
    if (a.discountType != b.discountType) return false
    if (a.actualPrice != b.actualPrice) return false

    if (a.quantityTotal != b.quantityTotal) return false
    if (a.quantityFinish != b.quantityFinish) return false

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
