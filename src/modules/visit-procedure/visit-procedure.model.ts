import {
  Expose,
  Type,
  instanceToInstance,
  instanceToPlain,
  plainToInstance,
} from 'class-transformer'
import { FROM_INSTANCE, FROM_PLAIN, USER_CREATE, USER_UPDATE } from '../_base/base-expose'
import { Procedure } from '../procedure'
import type { DiscountType } from '../enum'

export class VisitProcedure {
  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  id: number

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  visitId: number

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  customerId: number

  @Expose()
  procedureId: number

  @Expose()
  quantity: number

  @Expose()
  expectedPrice: number // Giá dự kiến

  @Expose()
  discountMoney: number // tiền giảm giá

  @Expose()
  discountPercent: number // % giảm giá

  @Expose()
  discountType: DiscountType // Loại giảm giá

  @Expose()
  actualPrice: number // Giá thực tế

  @Expose()
  createdAt: number

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Procedure)
  procedure?: Procedure

  static toBasic(root: VisitProcedure) {
    const ins = new VisitProcedure()
    Object.assign(ins, root)
    delete ins.procedure
    return ins
  }

  static fromPlain(dto: Record<string, any>): VisitProcedure {
    return plainToInstance(VisitProcedure, dto, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(dto: Record<string, any>[]): VisitProcedure[] {
    return plainToInstance(VisitProcedure, dto, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromInstance(instance: VisitProcedure): VisitProcedure {
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_INSTANCE],
    })
  }

  static toPlain(
    instance: VisitProcedure,
    type: typeof USER_CREATE | typeof USER_UPDATE
  ): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }

  static toPlains(
    instances: VisitProcedure[],
    type: typeof USER_CREATE | typeof USER_UPDATE
  ): Record<string, any> {
    return instances.map((i) => VisitProcedure.toPlain(i, type))
  }

  static clone(root: VisitProcedure): VisitProcedure {
    const result = new VisitProcedure()
    Object.assign(result, root)

    if (root.procedure) {
      result.procedure = new Procedure()
      Object.assign(result.procedure, root.procedure)
    }
    return result
  }

  static cloneList(roots: VisitProcedure[]): VisitProcedure[] {
    return roots.map((i) => VisitProcedure.clone(i))
  }
}
