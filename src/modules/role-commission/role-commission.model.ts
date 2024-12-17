import { Role } from '../role/role.model'

export enum RoleInteractType {
  Ticket = 1,
  Product = 2,
  Procedure = 3,
  Radiology = 4,
  Laboratory = 5,
}

export enum RoleInteractTypeText {
  Ticket = 'Phiếu khám',
  Procedure = 'Dịch vụ',
  Product = 'Sản phẩm',
  Radiology = 'Phiếu CĐHA',
  Laboratory = 'Xét nghiệm',
}

export enum CommissionCalculatorType {
  VND = 1,
  PercentTotal = 2,
  PercentProfit = 3,
}

export enum RoleScreenType {
  Welcome = 1,
  Payment = 2,
  Diagnosis = 3,
  Consumable = 4,
  Procedure = 5,
  Prescription = 6,
  Laboratory = 7,
  Radiology = 8,
}

export enum RoleScreenTypeText {
  Welcome = 'Tiếp đón',
  Payment = 'Thanh toán',
  Diagnosis = 'Khám và Chẩn đoán',
  Consumable = 'Chỉ định Vật tư',
  Procedure = 'Chỉ định Dịch vụ',
  Prescription = 'Kê đơn thuốc',
  Laboratory = 'Chỉ định CĐHA',
  Radiology = 'Chỉ định Xét nghiệm',
}

export class RoleCommission {
  id: number
  roleInteractType: RoleInteractType
  roleId: number
  itemId: number
  commissionValue: number
  commissionCalculatorType: CommissionCalculatorType

  role?: Role

  static init(): RoleCommission {
    const ins = new RoleCommission()
    ins.id = 0
    ins.roleId = 0
    ins.commissionCalculatorType = CommissionCalculatorType.VND
    ins.roleInteractType = RoleInteractType.Ticket
    return ins
  }

  static blank(): RoleCommission {
    const ins = RoleCommission.init()
    return ins
  }

  static basic(source: RoleCommission) {
    const target = new RoleCommission()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: RoleCommission[]): RoleCommission[] {
    return sources.map((i) => RoleCommission.basic(i))
  }

  static from(source: RoleCommission) {
    const target = RoleCommission.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'role')) {
      target.role = target.role ? Role.basic(target.role) : target.role
    }
    return target
  }

  static fromList(sourceList: RoleCommission[]) {
    return sourceList.map((i) => RoleCommission.from(i))
  }
}
