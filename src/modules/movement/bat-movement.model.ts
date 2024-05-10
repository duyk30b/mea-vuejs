import {
  Expose,
  instanceToPlain,
  plainToInstance,
  Transform,
  TransformationType,
  Type,
} from 'class-transformer'
import { FROM_PLAIN } from '../_base/base-expose'
import { BaseModel } from '../base.model'
import type { MovementType, UnitType } from '../enum'
import { Invoice } from '../invoice'
import { Receipt } from '../receipt'
import { Batch } from '../batch/batch.model'
import { Product } from '../product'

export class BatchMovement extends BaseModel {
  @Expose({ toClassOnly: true })
  productId: number

  @Expose({ toClassOnly: true })
  batchId: number

  @Expose()
  referenceId: number

  @Expose()
  type: MovementType

  @Expose()
  isRefund: boolean

  @Expose()
  openQuantity: number // Số lượng ban đầu

  @Expose()
  quantity: number // Số lượng +/-

  @Expose()
  @Transform(({ value, type }) => {
    if (type === TransformationType.PLAIN_TO_CLASS) {
      return JSON.parse(value || JSON.stringify({ name: '', rate: 1 }))
    } else if (type === TransformationType.CLASS_TO_PLAIN) {
      return JSON.stringify(value || { name: '', rate: 1 })
    } else if (type === TransformationType.CLASS_TO_CLASS) {
      return JSON.parse(JSON.stringify(value || { name: '', rate: 1 }))
    }
    return value
  })
  unit: UnitType

  @Expose()
  closeQuantity: number // Số lượng sau thay đổi

  @Expose()
  price: number // Giá

  @Expose()
  costAmount: number // Vốn

  @Expose()
  openCostAmount: number // Vốn

  @Expose()
  closeCostAmount: number // Vốn

  @Expose()
  createdAt: number

  @Expose({ toClassOnly: true })
  @Type(() => Batch)
  batch?: Batch

  @Expose({ toClassOnly: true })
  @Type(() => Product)
  product?: Product

  @Expose({ toClassOnly: true })
  @Type(() => Invoice)
  invoice?: Invoice

  @Expose({ toClassOnly: true })
  @Type(() => Receipt)
  receipt?: Receipt

  get unitQuantity() {
    return this.quantity / this.unit.rate
  }

  get unitPrice() {
    return this.price * this.unit.rate
  }

  static fromPlain(plain: Record<string, any>): BatchMovement {
    return plainToInstance(BatchMovement, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(plains: Record<string, any>[]): BatchMovement[] {
    return plainToInstance(BatchMovement, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static toPlain(instance: BatchMovement): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}
