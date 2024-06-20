import { Expose, instanceToPlain, plainToInstance, Type } from 'class-transformer'
import { FROM_PLAIN } from '../_base/base-expose'
import { BaseModel } from '../base.model'
import { Batch } from '../batch/batch.model'
import { VisitProduct } from '../visit-product'

export class VisitBatch extends BaseModel {
  @Expose()
  visitId: number

  @Expose()
  productId: number

  @Expose()
  batchId: number

  @Expose()
  visitProductId: number

  @Expose()
  quantity: number

  @Expose({ toClassOnly: true })
  @Type(() => Batch)
  batch?: Batch

  @Expose({ toClassOnly: true })
  @Type(() => VisitProduct)
  visitProduct?: VisitProduct

  static fromPlain(plain: Record<string, any>): VisitBatch {
    return plainToInstance(VisitBatch, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(plains: Record<string, any>[]): VisitBatch[] {
    return plainToInstance(VisitBatch, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static toPlain(instance: VisitBatch): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}
