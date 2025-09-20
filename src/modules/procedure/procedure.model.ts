import { Discount } from '../discount'
import { Position } from '../position'
import { ProcedureGroup } from '../procedure-group'

export enum ProcedureType {
  Basic = 1,
  Process = 2,
}

export const ProcedureTypeText = {
  [ProcedureType.Basic]: 'Cơ bản',
  [ProcedureType.Process]: 'Thủ thuật',
}

export class Procedure {
  id: number
  code: string
  name: string // Tên dịch vụ
  
  procedureGroupId: number
  procedureType: ProcedureType

  price: number
  isActive: 0 | 1

  procedureGroup?: ProcedureGroup

  positionRequestListCommon: Position[]
  positionRequestList: Position[]
  positionResultListCommon: Position[]
  positionResultList: Position[]

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
    ins.code = ''
    ins.name = ''
    ins.procedureGroupId = 0
    ins.procedureType = ProcedureType.Basic

    ins.price = 0

    ins.isActive = 1
    return ins
  }

  static blank() {
    const ins = Procedure.init()
    ins.positionRequestList = []
    ins.positionRequestListCommon = []
    ins.positionResultList = []
    ins.positionResultListCommon = []
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

    if (target.positionRequestList) {
      target.positionRequestList = Position.basicList(target.positionRequestList)
    }
    if (target.positionRequestListCommon) {
      target.positionRequestListCommon = Position.basicList(target.positionRequestListCommon)
    }
    if (target.positionResultList) {
      target.positionResultList = Position.basicList(target.positionResultList)
    }
    if (target.positionResultListCommon) {
      target.positionResultListCommon = Position.basicList(target.positionResultListCommon)
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
    if (a.code != b.code) return false
    if (a.name != b.name) return false

    if (a.procedureGroupId != b.procedureGroupId) return false
    if (a.procedureType != b.procedureType) return false

    if (a.price != b.price) return false
    if (a.isActive != b.isActive) return false

    return true
  }
}
