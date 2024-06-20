import {
  Expose,
  instanceToInstance,
  instanceToPlain,
  plainToInstance,
  Type,
} from 'class-transformer'
import { FROM_INSTANCE, FROM_PLAIN, USER_CREATE, USER_UPDATE } from '../_base/base-expose'
import { Customer } from '../customer'
import { CustomerPayment } from '../customer-payment/customer-payment.model'
import type { DiscountType } from '../enum'
import { VisitBatch } from '../visit-batch'
import { VisitDiagnosis } from '../visit-diagnosis'
import { VisitProcedure } from '../visit-procedure/visit-procedure.model'
import { VisitProduct } from '../visit-product/visit-product.model'

export enum VisitStatus {
  Scheduled = 1, // Hẹn khám
  Waiting = 2, // Đợi khám
  InProgress = 3, // Đang khám,
  Debt = 4, // Nợ
  Completed = 5,
}

export class Visit {
  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  id: number

  @Expose({})
  customerId: number

  @Expose()
  visitStatus: VisitStatus

  @Expose()
  isSent: number

  @Expose({})
  totalCostAmount: number

  @Expose({})
  proceduresMoney: number

  @Expose({})
  productsMoney: number

  @Expose()
  discountMoney: number // tiền giảm giá

  @Expose()
  discountPercent: number // % giảm giá

  @Expose()
  discountType: DiscountType // Loại giảm giá

  @Expose({})
  surcharge: number // Phụ phí

  @Expose({})
  totalMoney: number // Doanh thu = proceduresMoney + productsMoney + phụ phí - tiền giảm giá

  @Expose({})
  expense: number

  @Expose({})
  profit: number

  @Expose({})
  paid: number

  @Expose({})
  debt: number

  @Expose({})
  note: string

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  registeredAt: number // Giờ đăng ký khám

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  startedAt: number | null // Giờ vào khám

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  updatedAt: number | null // Giờ kết thúc khám

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Customer)
  customer?: Customer

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => CustomerPayment)
  customerPayments?: CustomerPayment[]

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => VisitDiagnosis)
  visitDiagnosis?: VisitDiagnosis

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => VisitProcedure)
  visitProcedureList?: VisitProcedure[]

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => VisitProduct)
  visitProductList?: VisitProduct[]

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => VisitBatch)
  visitBatchList?: VisitBatch[]

  static init(): Visit {
    const ins = new Visit()
    ins.id = 0
    return ins
  }

  static blank(): Visit {
    const ins = Visit.init()
    ins.visitProcedureList = []
    ins.visitProductList = []
    ins.visitDiagnosis = VisitDiagnosis.blank()
    return ins
  }

  static toBasic(root: Visit) {
    const ins = new Visit()
    Object.assign(ins, root)
    delete ins.customer
    delete ins.customerPayments
    delete ins.visitDiagnosis
    delete ins.visitProcedureList
    delete ins.visitProductList
    delete ins.visitBatchList
    return ins
  }

  static toBasics(roots: Visit[]) {
    return roots.map((i) => Visit.toBasic(i))
  }

  static fromPlain(dto: Record<string, any>): Visit {
    return plainToInstance(Visit, dto, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(dto: Record<string, any>[]): Visit[] {
    return plainToInstance(Visit, dto, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromInstance(instance: Visit): Visit {
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_INSTANCE],
    })
  }

  static toPlain(
    instance: Visit,
    type: typeof USER_CREATE | typeof USER_UPDATE
  ): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }
}
