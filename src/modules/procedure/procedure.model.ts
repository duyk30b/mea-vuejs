import { ProcedureGroup } from '../procedure-group'

export enum ProcedureType {
  Basic = 1,
  Regimen = 2, // Liệu trình
  Remedy = 3, // Bài thuốc
}

export class Procedure {
  id: number
  name: string // Tên dịch vụ
  procedureType: ProcedureType
  quantityDefault: number
  gapHours: number
  procedureGroupId: number
  price: number // Giá mặc định

  consumablesHint: string

  isActive: 1 | 0 // Trạng thái
  updatedAt: number
  deletedAt: number

  procedureGroup?: ProcedureGroup

  static init() {
    const ins = new Procedure()
    ins.id = 0
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
    return target
  }

  static fromList(sourceList: Procedure[]): Procedure[] {
    return sourceList.map((i) => Procedure.from(i))
  }
}
