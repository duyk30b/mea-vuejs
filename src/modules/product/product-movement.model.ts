import { Expose, instanceToPlain, plainToInstance, Type } from 'class-transformer'
import { BaseModel } from '../base.model'
import { Invoice } from '../invoice'
import { Receipt } from '../receipt'
import { ProductBatch } from './product-batch.model'

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
