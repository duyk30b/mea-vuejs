import { Laboratory } from '../laboratory'
import { Procedure } from '../procedure'
import { Product } from '../product'
import { Radiology } from '../radiology'
import { Role } from '../role/role.model'

export enum InteractType {
  Ticket = 1,
  Product = 2, // chỉ tương tác với sản phẩm
  Procedure = 3, // chỉ tương tác với thủ thuật
  Radiology = 4, // chỉ tương tác với phiếu CĐHA
  Laboratory = 5, // chỉ tương tác với phiếu xét nghiệm
  ConsumableList = 6, // tương tác với tất cả sản phẩm trong cả tiêu hao
  PrescriptionList = 7, // tương tác với tất cả sản phẩm trong cả toa thuốc
}

export const InteractTypeText = {
  [InteractType.Ticket]: 'Lượt tiếp đón',
  [InteractType.Procedure]: 'Dịch vụ',
  [InteractType.Product]: 'Sản phẩm',
  [InteractType.Radiology]: 'Phiếu CĐHA',
  [InteractType.Laboratory]: 'Xét nghiệm',
  [InteractType.ConsumableList]: 'Phiếu Vật tư',
  [InteractType.PrescriptionList]: 'Đơn thuốc',
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

export class Commission {
  id: number
  roleId: number
  interactType: InteractType
  interactId: number
  commissionCalculatorType: CommissionCalculatorType
  commissionValue: number

  role?: Role
  product?: Product
  procedure?: Procedure
  radiology?: Radiology
  laboratory?: Laboratory

  static init(): Commission {
    const ins = new Commission()
    ins.id = 0
    ins.roleId = 0
    ins.interactType = InteractType.Ticket
    ins.interactId = 0
    ins.commissionCalculatorType = CommissionCalculatorType.VND
    ins.commissionValue = 0
    return ins
  }

  static blank(): Commission {
    const ins = Commission.init()
    return ins
  }

  static basic(source: Commission) {
    const target = new Commission()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Commission[]): Commission[] {
    return sources.map((i) => Commission.basic(i))
  }

  static from(source: Commission) {
    const target = Commission.basic(source)
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

  static fromList(sourceList: Commission[]) {
    return sourceList.map((i) => Commission.from(i))
  }

  static equal(a: Commission, b: Commission) {
    if (a.id != b.id) return false
    if (a.roleId != b.roleId) return false
    if (a.interactType != b.interactType) return false
    if (a.interactId != b.interactId) return false
    if (a.commissionCalculatorType != b.commissionCalculatorType) return false
    if (a.commissionValue != b.commissionValue) return false
    return true
  }

  static equalList(a: Commission[], b: Commission[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!Commission.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
