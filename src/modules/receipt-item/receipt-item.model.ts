import {
  Expose,
  instanceToInstance,
  instanceToPlain,
  plainToInstance,
  Type,
} from 'class-transformer'
import { FROM_INSTANCE, FROM_PLAIN, USER_CREATE, USER_UPDATE } from '../_base/base-expose'
import { Batch } from '../batch'
import { Product } from '../product'
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
  costPrice: number // Giá cost

  @Expose()
  quantity: number = 0

  @Expose()
  unitRate: number

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Receipt)
  receipt?: Receipt

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Batch)
  batch?: Batch

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Product)
  product?: Product

  get unitName() {
    return this.product!.getUnitNameByRate(this.unitRate)
  }

  get unitQuantity() {
    return Number((this.quantity / this.unitRate).toFixed(3))
  }

  get unitCostPrice() {
    return this.costPrice * this.unitRate
  }

  set unitQuantity(data: number) {
    this.quantity = data * this.unitRate
  }

  get amount() {
    return this.costPrice * this.quantity
  }

  static init() {
    const ins = new ReceiptItem()
    ins.id = 0
    ins.quantity = 0
    ins.costPrice = 0
    ins.unitRate = 1
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

  static toPlain(
    instance: ReceiptItem,
    type: typeof USER_CREATE | typeof USER_UPDATE
  ): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }

  static toPlains(
    instances: ReceiptItem[],
    type: typeof USER_CREATE | typeof USER_UPDATE
  ): Record<string, any> {
    return instances.map((i) => ReceiptItem.toPlain(i, type))
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
