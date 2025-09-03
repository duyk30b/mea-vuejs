import { Discount } from '../discount'
import { LaboratoryGroup } from '../laboratory-group'
import { Position } from '../position'

export enum LaboratoryValueType {
  Number = 1,
  String = 2,
  Options = 3,
  Children = 4,
}

export class Laboratory {
  id: number
  laboratoryCode: string
  priority: number

  name: string
  laboratoryGroupId: number
  costPrice: number
  price: number

  level: number
  parentId: number

  valueType: LaboratoryValueType
  lowValue: number
  highValue: number
  unit: string
  options: string

  optionsParse: string[] // chỉ được convert ở front-end

  laboratoryGroup?: LaboratoryGroup
  children?: Laboratory[]

  positionRequestList?: Position[]
  positionRequestListCommon?: Position[]
  discountList: Discount[]
  discountListExtra: Discount[]

  static init() {
    const ins = new Laboratory()
    ins.id = 0
    ins.laboratoryCode = ''
    ins.priority = 0
    ins.name = ''
    ins.laboratoryGroupId = 0
    ins.price = 0
    ins.costPrice = 0
    ins.level = 1
    ins.parentId = 0
    ins.lowValue = 0
    ins.highValue = 0
    ins.valueType = LaboratoryValueType.String
    ins.price = 0
    ins.unit = ''
    ins.options = JSON.stringify([])
    ins.optionsParse = []
    ins.children = []
    return ins
  }

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

  static blank() {
    const ins = Laboratory.init()
    ins.positionRequestList = []
    ins.discountList = []
    ins.discountListExtra = []
    return ins
  }

  static basic(source: Laboratory) {
    const target = new Laboratory()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Laboratory[]): Laboratory[] {
    return sources.map((i) => Laboratory.basic(i))
  }

  static from(source: Laboratory) {
    const target = Laboratory.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'laboratoryGroup')) {
      target.laboratoryGroup = target.laboratoryGroup
        ? LaboratoryGroup.basic(target.laboratoryGroup)
        : target.laboratoryGroup
    }
    if (target.children) {
      target.children = Laboratory.basicList(target.children)
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

  static fromList(sourceList: Laboratory[]): Laboratory[] {
    return sourceList.map((i) => Laboratory.from(i))
  }

  static equal(a: Laboratory, b: Laboratory, options?: { children?: boolean }) {
    if (a.id != b.id) return false
    if (a.laboratoryCode != b.laboratoryCode) return false
    if (a.priority != b.priority) return false
    if (a.name != b.name) return false
    if (a.laboratoryGroupId != b.laboratoryGroupId) return false
    if (a.price != b.price) return false
    if (a.costPrice != b.costPrice) return false

    if (a.level != b.level) return false
    if (a.parentId != b.parentId) return false

    if (a.valueType != b.valueType) return false
    if (a.lowValue != b.lowValue) return false
    if (a.highValue != b.highValue) return false
    if (a.unit != b.unit) return false
    if (a.options != b.options) return false

    if (options?.children) {
      if (!Laboratory.equalList(a.children || [], b.children || [])) return false
    }
    return true
  }

  static equalList(a: Laboratory[], b: Laboratory[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!Laboratory.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
