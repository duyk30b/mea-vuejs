import { BaseModel } from '../_base/base.model'
import { Discount } from '../discount'
import { DiscountType } from '../enum'
import { Position } from '../position'
import { Procedure } from '../procedure'
import { RegimenItem } from './regimen-item.model'

export enum RegimenGapHoursType {
  Hour = 1,
  Day = 24,
  Week = 24 * 7,
  Month = 24 * 30,
}

export const RegimenGapHoursTypeText = {
  [RegimenGapHoursType.Hour]: 'Giờ',
  [RegimenGapHoursType.Day]: 'Ngày',
  [RegimenGapHoursType.Week]: 'Tuần',
  [RegimenGapHoursType.Month]: 'Tháng',
}

export class Regimen extends BaseModel {
  id: number
  code: string
  name: string // Tên dịch vụ

  isActive: 0 | 1

  regimenItemList?: RegimenItem[]

  positionRequestListCommon?: Position[]
  positionRequestList?: Position[]

  discountList?: Discount[]
  discountListExtra?: Discount[]

  get discountApply() {
    const discountList = [...(this.discountList || []), ...(this.discountListExtra || [])]
    const discountFilter = discountList.filter((i) => Discount.canApplyNow(i))
    discountFilter.sort((a, b) => {
      if (a.priority > b.priority) return -1
      if (a.priority < b.priority) return 1
      if (a.priority == b.priority) return a.discountInteractId == 0 ? 1 : -1
      return -1
    })
    return discountFilter[0]
  }

  get totalMoney() {
    return (this.regimenItemList || []).reduce(
      (acc, item) => acc + (item.procedure?.price || 0) * item.quantity,
      0,
    )
  }

  get totalMoneyAfterDiscount() {
    const totalMoney = this.totalMoney
    const discountApply = this.discountApply
    if (discountApply?.discountType === DiscountType.VND) {
      return totalMoney - discountApply.discountMoney
    }
    if (discountApply?.discountType === DiscountType.Percent) {
      return (totalMoney * (100 - discountApply.discountPercent)) / 100
    }
    return totalMoney
  }

  static init() {
    const ins = new Regimen()
    ins.id = 0
    ins.code = ''
    ins.name = ''

    ins.isActive = 1
    ins._localId = Math.random().toString(36).substring(2)
    return ins
  }

  static blank() {
    const ins = Regimen.init()

    ins.regimenItemList = []

    ins.positionRequestList = []
    ins.positionRequestListCommon = []
    ins.discountList = []
    ins.discountListExtra = []
    return ins
  }

  static basic(source: Regimen) {
    const target = new Regimen()
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

  static basicList(sources: Regimen[]): Regimen[] {
    return sources.map((i) => Regimen.basic(i))
  }

  static from(source: Regimen) {
    const target = Regimen.basic(source)

    if (target.regimenItemList) {
      target.regimenItemList = RegimenItem.basicList(target.regimenItemList)
      target.regimenItemList!.forEach((regimenItem) => {
        regimenItem.procedure = Procedure.basic(regimenItem.procedure)
      })
    }

    if (target.positionRequestList) {
      target.positionRequestList = Position.basicList(target.positionRequestList)
    }
    if (target.positionRequestListCommon) {
      target.positionRequestListCommon = Position.basicList(target.positionRequestListCommon)
    }

    if (target.discountList) {
      target.discountList = Discount.basicList(target.discountList)
    }
    if (target.discountListExtra) {
      target.discountListExtra = Discount.basicList(target.discountListExtra)
    }
    return target
  }

  static fromList(sourceList: Regimen[]): Regimen[] {
    return sourceList.map((i) => Regimen.from(i))
  }

  static equal(a: Regimen, b: Regimen) {
    if (a.id != b.id) return false
    if (a.code != b.code) return false
    if (a.name != b.name) return false

    if (a.isActive != b.isActive) return false

    return true
  }

  static equalList(a: Regimen[], b: Regimen[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!Regimen.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
