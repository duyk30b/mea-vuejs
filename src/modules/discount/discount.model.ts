import { BaseModel } from '../_base/base.model'
import { DiscountType } from '../enum'
import type { Laboratory } from '../laboratory'
import type { Procedure } from '../procedure'
import type { Product } from '../product'
import type { Radiology } from '../radiology'

export enum DiscountInteractType {
  Product = 1,
  Procedure = 2,
  Laboratory = 3,
  Radiology = 4,
}

export const DiscountInteractTypeText = {
  [DiscountInteractType.Product]: 'Sản phẩm',
  [DiscountInteractType.Procedure]: 'Dịch vụ',
  [DiscountInteractType.Laboratory]: 'Xét nghiệm',
  [DiscountInteractType.Radiology]: 'Phiếu CĐHA',
}

export enum DiscountRepeatType {
  Once = 1, // không repeat
  Weekly = 2, // Hàng ngày, từ thứ 2 đến chủ nhật
}
export class Discount extends BaseModel {
  id: number
  priority: number
  discountInteractType: DiscountInteractType
  discountInteractId: number

  discountMoney: number
  discountPercent: number
  discountType: DiscountType

  discountRepeatType: DiscountRepeatType
  periodsDay: string // [2,3,4,5,6,7]
  periodsTime: string // [[11:30,13:30],[15h:17h],[21h:23h]]

  product?: Product
  procedure?: Procedure
  radiology?: Radiology
  laboratory?: Laboratory

  get periodsDayParse() {
    try {
      const parse: number[] = JSON.parse(this.periodsDay)
      return parse
    } catch (error) {
      return <number[]>[]
    }
  }

  get periodsDayText() {
    const dayName: Record<string, string> = {
      1: 'Thứ 2',
      2: 'Thứ 3',
      3: 'Thứ 4',
      4: 'Thứ 5',
      5: 'Thứ 6',
      6: 'Thứ 7',
      7: 'Chủ Nhật',
    }
    return this.periodsDayParse.map((i: any) => dayName[i]).join(', ')
  }

  get periodsTimeParse() {
    try {
      const parse: [string, string][] = JSON.parse(this.periodsTime)
      return parse
    } catch (error) {
      return <[string, string][]>[]
    }
  }

  static init(): Discount {
    const ins = new Discount()
    ins._localId = Math.random()
    ins.id = 0
    return ins
  }

  static blank(): Discount {
    const ins = Discount.init()
    ins.priority = 0
    ins.discountInteractType = DiscountInteractType.Product
    ins.discountInteractId = 0

    ins.discountMoney = 0
    ins.discountPercent = 0
    ins.discountType = DiscountType.Percent

    ins.discountRepeatType = DiscountRepeatType.Weekly
    ins.periodsDay = JSON.stringify([])
    ins.periodsTime = JSON.stringify([['00:00', '23:59']])

    return ins
  }

  static basic(source: Discount) {
    const target = new Discount()
    target._localId = source.id || source._localId || Math.random()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Discount[]): Discount[] {
    return sources.map((i) => Discount.basic(i))
  }

  static from(source: Discount) {
    const target = Discount.basic(source)
    return target
  }

  static fromList(sourceList: Discount[]) {
    return sourceList.map((i) => Discount.from(i))
  }

  static equal(a: Discount, b: Discount) {
    if (a.id != b.id) return false
    if (a.discountInteractType != b.discountInteractType) return false
    if (a.discountInteractId != b.discountInteractId) return false
    if (a.discountMoney != b.discountMoney) return false
    if (a.discountPercent != b.discountPercent) return false
    if (a.discountType != b.discountType) return false
    if (a.discountRepeatType != b.discountRepeatType) return false
    if (a.periodsDay != b.periodsDay) return false
    if (a.periodsTime != b.periodsTime) return false
    return true
  }

  static equalList(a: Discount[], b: Discount[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!Discount.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
