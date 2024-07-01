import type { DiscountType } from '../enum'
import { Procedure } from '../procedure'

export class VisitProcedure {
  id: number
  visitId: number
  customerId: number
  procedureId: number
  quantity: number
  expectedPrice: number // Giá dự kiến
  discountMoney: number // tiền giảm giá
  discountPercent: number // % giảm giá
  discountType: DiscountType // Loại giảm giá
  actualPrice: number // Giá thực tế
  createdAt: number
  procedure?: Procedure

  static init(): VisitProcedure {
    const ins = new VisitProcedure()
    ins.id = 0
    ins.quantity = 0
    ins.expectedPrice = 0
    ins.discountMoney = 0
    ins.discountPercent = 0
    ins.actualPrice = 0
    return ins
  }

  static blank(): VisitProcedure {
    const ins = VisitProcedure.init()
    ins.procedure = Procedure.init()
    return ins
  }

  static from(source: VisitProcedure) {
    const target = new VisitProcedure()
    Object.assign(target, source)
    if (Object.prototype.hasOwnProperty.call(source, 'procedure')) {
      if (!source.procedure) {
        target.procedure = source.procedure
      } else {
        const procedure = new Procedure()
        Object.assign(procedure, source.procedure)
        target.procedure = procedure
      }
    }
    return target
  }

  static fromList(sourceList: VisitProcedure[]): VisitProcedure[] {
    return sourceList.map((i) => VisitProcedure.from(i))
  }
}
