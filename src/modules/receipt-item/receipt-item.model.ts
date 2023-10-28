import {
  Expose,
  instanceToInstance,
  plainToInstance,
  Transform,
  TransformationType,
  Type,
} from 'class-transformer'
import { FROM_INSTANCE, FROM_PLAIN } from '../_base/base-expose'
import type { UnitType } from '../enum'
import { Product } from '../product'
import { Batch } from '../batch'
import { Receipt } from '../receipt/receipt.model'

export class ReceiptItem {
  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  id: number

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  receiptId: number

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  distributorId: number

  @Expose()
  productId: number

  @Expose()
  batchId: number

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
  costPrice: number // Giá cost

  @Expose()
  quantity: number = 0

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Receipt)
  receipt?: Receipt

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Batch)
  batch?: Batch

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Product)
  product?: Product

  get unitQuantity() {
    return Number((this.quantity / this.unit.rate).toFixed(3))
  }

  get unitCostPrice() {
    return this.costPrice * this.unit.rate
  }

  set unitQuantity(data: number) {
    this.quantity = data * this.unit.rate
  }

  get amount() {
    return this.costPrice * this.quantity
  }

  static init() {
    const ins = new ReceiptItem()
    ins.id = 0
    ins.quantity = 0
    ins.costPrice = 0
    ins.unit = { rate: 1, name: '' }
    return ins
  }

  static blank() {
    const ins = ReceiptItem.init()
    ins.batch = Batch.init()
    ins.product = Product.init()
    ins.receipt = Receipt.init()
    return ins
  }

  static fromPlain(plain: Record<string, any>): ReceiptItem {
    return plainToInstance(ReceiptItem, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(plains: Record<string, any>[]): ReceiptItem[] {
    return plainToInstance(ReceiptItem, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromInstance(instance: ReceiptItem): ReceiptItem {
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_INSTANCE],
    })
  }

  static fromInstances(instances: ReceiptItem[]): ReceiptItem[] {
    return instanceToInstance(instances, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_INSTANCE],
    })
  }

  static clone(root: ReceiptItem): ReceiptItem {
    const ins = ReceiptItem.fromInstance(root)
    if (root.batch) {
      ins.batch = Batch.fromInstance(root.batch)
    }
    if (root.product) {
      ins.product = Product.fromInstance(root.product)
    }

    return ins
  }
}
