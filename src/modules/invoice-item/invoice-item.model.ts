import {
  Expose,
  instanceToInstance,
  plainToInstance,
  Transform,
  TransformationType,
  Type,
} from 'class-transformer'
import { FROM_INSTANCE, FROM_PLAIN } from '../_base/base-expose'
import { BaseModel } from '../base.model'
import { Batch } from '../batch'
import { Customer } from '../customer'
import { DiscountType, type UnitType } from '../enum'
import { Invoice } from '../invoice/invoice.model'
import { Procedure } from '../procedure'
import { Product } from '../product'

export enum InvoiceItemType {
  Batch = 1,
  Procedure = 2,
  Product = 3,
  ProductNoManageQuantity = 4,
}

export class InvoiceItem extends BaseModel {
  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  invoiceId: number

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  customerId: number

  @Expose()
  productId: number

  @Expose()
  batchId: number

  @Expose()
  procedureId: number

  @Expose()
  type: InvoiceItemType

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
  costAmount: number // Giá cost

  @Expose()
  expectedPrice: number // Giá dự kiến

  @Expose()
  discountMoney: number // tiền giảm giá

  @Expose()
  discountPercent: number // % giảm giá

  @Expose()
  discountType: DiscountType // Loại giảm giá

  @Expose()
  actualPrice: number // Giá thực tế

  @Expose()
  quantity: number

  @Expose() // Hướng dẫn sử dụng
  hintUsage: string | null

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Invoice)
  invoice?: Invoice

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Product)
  product?: Product

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Batch)
  batch?: Batch

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Procedure)
  procedure?: Procedure

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Customer)
  customer?: Customer

  get unitQuantity() {
    return Number((this.quantity / this.unit.rate).toFixed(3))
  }

  get unitCostPrice() {
    return this.costPrice * this.unit.rate
  }

  get unitExpectedPrice() {
    return this.expectedPrice * this.unit.rate
  }

  get unitDiscountMoney() {
    return this.discountMoney * this.unit.rate
  }

  get unitActualPrice() {
    return this.actualPrice * this.unit.rate
  }

  set unitQuantity(data: number) {
    this.quantity = data * this.unit.rate
  }

  set unitCostPrice(data: number) {
    this.costPrice = data / this.unit.rate
  }

  set unitExpectedPrice(data: number) {
    this.expectedPrice = data / this.unit.rate
  }

  set unitDiscountMoney(data: number) {
    this.discountMoney = data / this.unit.rate
  }

  set unitActualPrice(data: number) {
    this.actualPrice = data / this.unit.rate
  }

  static init() {
    const ins = new InvoiceItem()
    ins.id = 0
    ins.unit = { name: '', rate: 1 }
    ins.costPrice = 0
    ins.expectedPrice = 0
    ins.discountMoney = 0
    ins.discountPercent = 0
    ins.discountType = DiscountType.Percent
    ins.actualPrice = 0
    ins.quantity = 0
    return ins
  }

  static blank(): InvoiceItem {
    const ins = InvoiceItem.init()
    return ins
  }

  static fromPlain(plain: Record<string, any>): InvoiceItem {
    return plainToInstance(InvoiceItem, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(plains: Record<string, any>[]): InvoiceItem[] {
    return plainToInstance(InvoiceItem, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromInstance(instance: InvoiceItem): InvoiceItem {
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_INSTANCE],
    })
  }

  static fromInstances(instances: InvoiceItem[]): InvoiceItem[] {
    return instanceToInstance(instances, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_INSTANCE],
    })
  }

  static clone(root: InvoiceItem): InvoiceItem {
    const ins = InvoiceItem.fromInstance(root)
    if (root.procedure) {
      ins.procedure = Procedure.fromInstance(root.procedure)
    }
    if (root.batch) {
      ins.batch = Batch.fromInstance(root.batch)
    }
    if (root.product) {
      ins.product = Product.fromInstance(root.product)
    }
    return ins
  }
}
