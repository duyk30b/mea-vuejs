import { Expose, plainToInstance, Transform, TransformationType, Type } from 'class-transformer'
import { BaseModel } from '../base.model'
import { ProductBatch } from '../product'
import { Receipt } from './receipt.model'

export class ReceiptItem extends BaseModel {
  @Expose({ toClassOnly: true })
  receiptId: number

  @Expose({ toClassOnly: true })
  distributorId: number

  @Expose()
  productBatchId: number

  @Expose()
  unit: { name: string; rate: number } = { name: '', rate: 1 }

  @Expose()
  quantity: number = 0

  @Expose({ toClassOnly: true })
  @Type(() => Receipt)
  receipt?: Receipt

  @Expose({ toClassOnly: true })
  @Type(() => ProductBatch)
  productBatch: ProductBatch

  static fromPlain(plain: Record<string, any>): ReceiptItem {
    return plainToInstance(ReceiptItem, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromPlains(plains: Record<string, any>[]): ReceiptItem[] {
    return plainToInstance(ReceiptItem, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromObject(object: ReceiptItem): ReceiptItem {
    const instance = new ReceiptItem()
    Object.assign(instance, object)
    return instance
  }
}
