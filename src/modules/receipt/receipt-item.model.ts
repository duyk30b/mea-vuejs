import {
  Expose,
  instanceToInstance,
  plainToInstance,
  Transform,
  TransformationType,
  Type,
} from 'class-transformer'
import type { UnitType } from '../enum'
import { Product, ProductBatch } from '../product'
import { Receipt } from './receipt.model'

export class ReceiptItem {
  @Expose({ groups: ['ALL', 'COPY'] })
  id: number

  @Expose({ groups: ['ALL', 'COPY'] })
  receiptId: number

  @Expose({ groups: ['ALL', 'COPY'] })
  distributorId: number

  @Expose()
  productBatchId: number

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
  quantity: number = 0

  @Expose()
  costPrice: number // Giá cost

  @Expose({ groups: ['ALL'] })
  @Type(() => Receipt)
  receipt?: Receipt

  @Expose({ groups: ['ALL'] })
  @Type(() => ProductBatch)
  productBatch?: ProductBatch

  get unitQuantity() {
    return Number((this.quantity / this.unit.rate).toFixed(3))
  }

  get unitCostPrice() {
    return this.costPrice * this.unit.rate
  }

  set unitQuantity(data: number) {
    this.quantity = data * this.unit.rate
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
    ins.productBatch = ProductBatch.init()
    ins.productBatch.product = Product.init()
    ins.receipt = Receipt.init()
    return ins
  }

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

  static fromInstance(instance: ReceiptItem): ReceiptItem {
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['COPY'],
    })
  }

  static fromInstances(instances: ReceiptItem[]): ReceiptItem[] {
    return instanceToInstance(instances, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['COPY'],
    })
  }

  static clone(root: ReceiptItem): ReceiptItem {
    const ins = ReceiptItem.fromInstance(root)
    if (root.productBatch) {
      ins.productBatch = ProductBatch.fromInstance(root.productBatch)
      if (root.productBatch.product) {
        ins.productBatch.product = Product.fromInstance(root.productBatch.product)
      }
    }

    return ins
  }
}
