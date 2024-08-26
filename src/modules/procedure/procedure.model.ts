import { DiscountType } from '../enum'

export enum ProcedureType {
  Basic = 1,
  Remedy = 2, // Bài thuốc
  // Regimen = 2, // Liệu trình
}

export class Procedure {
  id: number
  name: string // Tên dịch vụ
  group: string // Nhóm dịch vụ ...
  procedureType: ProcedureType
  quantityDefault: number
  gapHours: number
  price: number // Giá mặc định
  discountMoney: number // tiền giảm giá mặc định
  discountPercent: number // tiền giảm giá mặc định
  discountType: DiscountType // tiền giảm giá mặc định
  saleBolusMoney: number // thưởng chốt sale
  saleBolusPercent: number // thưởng chốt sale
  saleBolusType: DiscountType // thưởng chốt sale
  primaryBolusMoney: number // thưởng thợ chính
  primaryBolusPercent: number // thưởng thợ chính
  primaryBolusType: DiscountType // thưởng thợ chính
  secondaryBolusMoney: number // thưởng thợ phụ
  secondaryBolusPercent: number // thưởng thợ phụ
  secondaryBolusType: DiscountType // thưởng thợ phụ
  consumablesHint: string
  isActive: 1 | 0 // Trạng thái
  updatedAt: number
  deletedAt: number

  static init() {
    const ins = new Procedure()
    ins.id = 0
    ins.procedureType = ProcedureType.Basic
    ins.quantityDefault = 1
    ins.gapHours = 0

    ins.price = 0
    ins.discountMoney = 0
    ins.discountPercent = 0
    ins.discountType = DiscountType.VND
    ins.saleBolusMoney = 0
    ins.saleBolusPercent = 0
    ins.saleBolusType = DiscountType.VND
    ins.primaryBolusMoney = 0
    ins.primaryBolusPercent = 0
    ins.primaryBolusType = DiscountType.VND
    ins.secondaryBolusMoney = 0
    ins.secondaryBolusPercent = 0
    ins.secondaryBolusType = DiscountType.VND

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
    return target
  }

  static fromList(sourceList: Procedure[]): Procedure[] {
    return sourceList.map((i) => Procedure.from(i))
  }
}
