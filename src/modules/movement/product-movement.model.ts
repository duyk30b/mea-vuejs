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
import { Product } from '../product'
import { Receipt } from '../receipt'

export class ProductMovement extends BaseModel {
  @Expose({ toClassOnly: true })
  productId: number

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

  static fromPlain(plain: Record<string, any>): ProductMovement {
    return plainToInstance(ProductMovement, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(plains: Record<string, any>[]): ProductMovement[] {
    return plainToInstance(ProductMovement, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static toPlain(instance: ProductMovement): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}
