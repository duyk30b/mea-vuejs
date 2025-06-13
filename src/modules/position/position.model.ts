import { BaseModel } from '../_base/base.model'
import { Laboratory } from '../laboratory'
import { Procedure } from '../procedure'
import { Product } from '../product'
import { Radiology } from '../radiology'
import { Role } from '../role/role.model'

export enum PositionInteractType {
  Ticket = 1,
  Product = 2, // chỉ tương tác với sản phẩm
  Procedure = 3, // chỉ tương tác với thủ thuật
  Radiology = 4, // chỉ tương tác với phiếu CĐHA
  Laboratory = 5, // chỉ tương tác với phiếu xét nghiệm
  ConsumableList = 6, // tương tác với tất cả sản phẩm trong cả tiêu hao
  PrescriptionList = 7, // tương tác với tất cả sản phẩm trong cả toa thuốc
}

export const PositionInteractTypeText = {
  [PositionInteractType.Ticket]: 'Phòng khám',
  [PositionInteractType.Procedure]: 'Dịch vụ',
  [PositionInteractType.Product]: 'Sản phẩm',
  [PositionInteractType.Radiology]: 'Phiếu CĐHA',
  [PositionInteractType.Laboratory]: 'Xét nghiệm',
  [PositionInteractType.ConsumableList]: 'Phiếu Vật tư',
  [PositionInteractType.PrescriptionList]: 'Đơn thuốc',
}

export enum CommissionCalculatorType {
  VND = 1,
  PercentExpected = 2,
  PercentActual = 3,
}

export const CommissionCalculatorTypeText = {
  [CommissionCalculatorType.VND]: 'VNĐ',
  [CommissionCalculatorType.PercentExpected]: '% Niêm yết',
  [CommissionCalculatorType.PercentActual]: '% Thực tế',
}

export class Position extends BaseModel {
  id: number
  roleId: number
  positionType: PositionInteractType
  positionInteractId: number
  commissionCalculatorType: CommissionCalculatorType
  commissionValue: number

  role?: Role
  product?: Product
  procedure?: Procedure
  radiology?: Radiology
  laboratory?: Laboratory

  static init(): Position {
    const ins = new Position()
    ins._localId = Math.random()
    ins.id = 0
    ins.roleId = 0
    ins.positionType = PositionInteractType.Ticket
    ins.positionInteractId = 0
    ins.commissionCalculatorType = CommissionCalculatorType.VND
    ins.commissionValue = 0
    return ins
  }

  static blank(): Position {
    const ins = Position.init()
    return ins
  }

  static basic(source: Position) {
    const target = new Position()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    target._localId = source.id || source._localId || Math.random()
    return target
  }

  static basicList(sources: Position[]): Position[] {
    return sources.map((i) => Position.basic(i))
  }

  static from(source: Position) {
    const target = Position.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'role')) {
      target.role = target.role ? Role.basic(target.role) : target.role
    }
    if (Object.prototype.hasOwnProperty.call(source, 'product')) {
      target.product = target.product ? Product.basic(target.product) : target.product
    }
    if (Object.prototype.hasOwnProperty.call(source, 'procedure')) {
      target.procedure = target.procedure ? Procedure.basic(target.procedure) : target.procedure
    }
    if (Object.prototype.hasOwnProperty.call(source, 'radiology')) {
      target.radiology = target.radiology ? Radiology.basic(target.radiology) : target.radiology
    }
    if (Object.prototype.hasOwnProperty.call(source, 'laboratory')) {
      target.laboratory = target.laboratory
        ? Laboratory.basic(target.laboratory)
        : target.laboratory
    }
    return target
  }

  static fromList(sourceList: Position[]) {
    return sourceList.map((i) => Position.from(i))
  }

  static equal(a: Position, b: Position) {
    if (a.id != b.id) return false
    if (a.roleId != b.roleId) return false
    if (a.positionType != b.positionType) return false
    if (a.positionInteractId != b.positionInteractId) return false
    if (a.commissionCalculatorType != b.commissionCalculatorType) return false
    if (a.commissionValue != b.commissionValue) return false
    return true
  }

  static equalList(a: Position[], b: Position[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!Position.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
