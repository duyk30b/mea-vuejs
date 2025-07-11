import { Discount } from '../discount'
import { Position } from '../position'
import { ProcedureGroup } from '../procedure-group'

export enum ProcedureType {
  Basic = 1,
  Regimen = 2, // Liệu trình
  Remedy = 3, // Bài thuốc
}

export class Procedure {
  id: number
  procedureCode: string
  name: string // Tên dịch vụ
  procedureType: ProcedureType
  quantityDefault: number
  gapHours: number
  procedureGroupId: number
  price: number // Giá mặc định

  consumablesHint: string

  isActive: 1 | 0 // Trạng thái
  updatedAt: number

  procedureGroup?: ProcedureGroup

  positionList?: Position[]
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

  static init() {
    const ins = new Procedure()
    ins.id = 0
    ins.procedureCode = ''
    ins.procedureType = ProcedureType.Basic
    ins.quantityDefault = 1
    ins.procedureGroupId = 0
    ins.gapHours = 0

    ins.price = 0

    ins.consumablesHint = JSON.stringify([])
    ins.isActive = 1
    return ins
  }

  static blank() {
    const ins = Procedure.init()
    ins.positionList = []
    ins.discountList = []
    ins.discountListExtra = []
    return ins
  }

  static basic(source?: Procedure) {
    const target = new Procedure()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Procedure[]): Procedure[] {
    return sources.map((i) => Procedure.basic(i))
  }

  static from(source?: Procedure) {
    const target = Procedure.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'procedureGroup')) {
      target.procedureGroup = target.procedureGroup
        ? ProcedureGroup.basic(target.procedureGroup)
        : target.procedureGroup
    }

    if (target.positionList) {
      target.positionList = Position.basicList(target.positionList)
    }
    if (target.discountList) {
      target.discountList = Discount.basicList(target.discountList)
    }
    if (target.discountListExtra) {
      target.discountListExtra = Discount.basicList(target.discountListExtra)
    }
    return target
  }

  static fromList(sourceList: Procedure[]): Procedure[] {
    return sourceList.map((i) => Procedure.from(i))
  }

  static equal(a: Procedure, b: Procedure) {
    if (a.id != b.id) return false
    if (a.procedureCode != b.procedureCode) return false
    if (a.name != b.name) return false
    if (a.procedureType != b.procedureType) return false
    if (a.quantityDefault != b.quantityDefault) return false
    if (a.gapHours != b.gapHours) return false
    if (a.procedureGroupId != b.procedureGroupId) return false
    if (a.price != b.price) return false

    if (a.consumablesHint != b.consumablesHint) return false
    if (a.isActive != b.isActive) return false
    if (a.updatedAt != b.updatedAt) return false

    return true
  }
}
