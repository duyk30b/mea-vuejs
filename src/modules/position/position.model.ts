import { BaseModel } from '../_base/base.model'
import { Laboratory } from '../laboratory'
import { LaboratoryGroup } from '../laboratory-group'
import { Procedure } from '../procedure'
import { Product } from '../product'
import { Radiology } from '../radiology'
import { Regimen } from '../regimen'
import { Role } from '../role/role.model'

export enum PositionType {
  Reception = 1,
  TicketClinic = 2,
  ProductRequest = 3,
  TicketPrescriptionRequest = 4,
  ProcedureRequest = 5,
  ProcedureResult = 6,
  RegimenRequest = 7,
  LaboratoryRequest = 8,
  LaboratoryGroupRequest = 9,
  LaboratoryGroupResult = 10,
  RadiologyRequest = 11,
  RadiologyResult = 12,
}

export const PositionTypeText = {
  [PositionType.Reception]: 'Tiếp đón',
  [PositionType.TicketClinic]: 'Phòng khám',
  [PositionType.ProductRequest]: 'Chỉ định sản phẩm',
  [PositionType.TicketPrescriptionRequest]: 'Kê đơn thuốc',
  [PositionType.ProcedureRequest]: 'Chỉ định dịch vụ',
  [PositionType.ProcedureResult]: 'Thực hiện dịch vụ',
  [PositionType.RegimenRequest]: 'Chỉ định liệu trình',
  [PositionType.LaboratoryRequest]: 'Chỉ định xét nghiệm',
  [PositionType.LaboratoryGroupRequest]: 'Chỉ định nhóm phiếu xét nghiệm',
  [PositionType.LaboratoryGroupResult]: 'Trả kết quả nhóm phiếu xét nghiệm',
  [PositionType.RadiologyRequest]: 'Chỉ định CĐHA',
  [PositionType.RadiologyResult]: 'Trả kết quả CĐHA',
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
  positionType: PositionType
  positionInteractId: number
  roleId: number

  priority: number
  commissionCalculatorType: CommissionCalculatorType
  commissionValue: number

  role?: Role
  productRequest?: Product
  regimenRequest?: Regimen
  procedureRequest?: Procedure
  procedureResult?: Procedure
  laboratoryRequest?: Laboratory
  laboratoryGroupRequest?: LaboratoryGroup
  laboratoryGroupResult?: LaboratoryGroup
  radiologyRequest?: Radiology
  radiologyResult?: Radiology

  static init(): Position {
    const ins = new Position()
    ins._localId = Math.random().toString(36).substring(2)
    ins.id = 0
    ins.roleId = 0
    ins.priority = 0
    ins.positionType = PositionType.Reception
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
    target._localId = String(
      source.id || source._localId || Math.random().toString(36).substring(2),
    )
    return target
  }

  static basicList(sources: Position[]): Position[] {
    return sources.map((i) => Position.basic(i))
  }

  static from(source: Position) {
    const target = Position.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'role')) {
      target.role = source.role ? Role.basic(source.role) : source.role
    }
    if (Object.prototype.hasOwnProperty.call(source, 'productRequest')) {
      target.productRequest = source.productRequest
        ? Product.basic(source.productRequest)
        : source.productRequest
    }
    if (Object.prototype.hasOwnProperty.call(source, 'regimenRequest')) {
      target.regimenRequest = source.regimenRequest
        ? Regimen.basic(source.regimenRequest)
        : source.regimenRequest
    }
    if (Object.prototype.hasOwnProperty.call(source, 'procedureRequest')) {
      target.procedureRequest = source.procedureRequest
        ? Procedure.basic(source.procedureRequest)
        : source.procedureRequest
    }
    if (Object.prototype.hasOwnProperty.call(source, 'laboratoryRequest')) {
      target.laboratoryRequest = source.laboratoryRequest
        ? Laboratory.basic(source.laboratoryRequest)
        : source.laboratoryRequest
    }
    if (Object.prototype.hasOwnProperty.call(source, 'laboratoryGroupRequest')) {
      target.laboratoryGroupRequest = source.laboratoryGroupRequest
        ? LaboratoryGroup.basic(source.laboratoryGroupRequest)
        : source.laboratoryGroupRequest
    }
    if (Object.prototype.hasOwnProperty.call(source, 'laboratoryGroupResult')) {
      target.laboratoryGroupResult = source.laboratoryGroupResult
        ? LaboratoryGroup.basic(source.laboratoryGroupResult)
        : source.laboratoryGroupResult
    }
    if (Object.prototype.hasOwnProperty.call(source, 'radiologyRequest')) {
      target.radiologyRequest = source.radiologyRequest
        ? Radiology.basic(source.radiologyRequest)
        : source.radiologyRequest
    }
    if (Object.prototype.hasOwnProperty.call(source, 'radiologyResult')) {
      target.radiologyResult = source.radiologyResult
        ? Radiology.basic(source.radiologyResult)
        : source.radiologyResult
    }
    return target
  }

  static fromList(sourceList: Position[]) {
    return sourceList.map((i) => Position.from(i))
  }

  static equal(a: Position, b: Position) {
    if (a.id != b.id) return false
    if (a.positionType != b.positionType) return false
    if (a.positionInteractId != b.positionInteractId) return false
    if (a.roleId != b.roleId) return false

    if (a.priority != b.priority) return false
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
