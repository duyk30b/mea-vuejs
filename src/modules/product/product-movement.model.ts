import {
  Expose,
  instanceToPlain,
  plainToInstance,
  Transform,
  TransformationType,
  Type,
} from 'class-transformer'
import { BaseModel } from '../base.model'
import type { UnitType } from '../enum'
import { Invoice } from '../invoice'
import { ProductBatch } from '../product-batch/product-batch.model'
import { Receipt } from '../receipt'

export enum ProductMovementType {
  Receipt = 1,
  Invoice = 2,
}

export class ProductMovement extends BaseModel {
  @Expose({ toClassOnly: true })
  productId: number

  @Expose({ toClassOnly: true })
  productBatchId: number

  @Expose()
  referenceId: number

  @Expose()
  type: ProductMovementType

  @Expose()
  isRefund: boolean

  @Expose()
  openQuantity: number // Số lượng ban đầu

  @Expose()
  number: number // Số lượng +/-

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
  totalMoney: number // Tổng tiền

  @Expose()
  createTime: number

  @Expose({ toClassOnly: true })
  @Type(() => ProductBatch)
  productBatch?: ProductBatch

  @Expose({ toClassOnly: true })
  @Type(() => Invoice)
  invoice?: Invoice

  @Expose({ toClassOnly: true })
  @Type(() => Receipt)
  receipt?: Receipt

  get unitNumber() {
    return this.number / this.unit.rate
  }

  get unitPrice() {
    return this.price * this.unit.rate
  }

  static fromPlain(plain: Record<string, any>): ProductMovement {
    return plainToInstance(ProductMovement, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromPlains(plains: Record<string, any>[]): ProductMovement[] {
    return plainToInstance(ProductMovement, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static toPlain(instance: ProductMovement): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}
