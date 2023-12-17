import {
  Expose,
  instanceToInstance,
  plainToInstance,
  Transform,
  TransformationType,
  Type,
} from 'class-transformer'
import { BaseModel } from '../base.model'
import { Customer } from '../customer'
import { DiscountType, type UnitType } from '../enum'
import { Procedure } from '../procedure'
import { Product, ProductBatch } from '../product'
import { Invoice } from './invoice.model'

export enum InvoiceItemType {
  ProductBatch = 1,
  Procedure = 2,
}

export class InvoiceItem extends BaseModel {
  @Expose({ groups: ['ALL', 'COPY'] })
  invoiceId: number

  @Expose({ groups: ['ALL', 'COPY'] })
  customerId: number

  @Expose()
  referenceId: number

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
  @Transform(({ value }) => value || 0)
  costPrice: number // Giá cost

  @Expose()
  @Transform(({ value }) => value || 0)
  expectedPrice: number // Giá dự kiến

  @Expose()
  @Transform(({ value }) => value || 0)
  discountMoney: number // tiền giảm giá

  @Expose()
  @Transform(({ value }) => value || 0)
  discountPercent: number // % giảm giá

  @Expose()
  @Transform(({ value }) => value || DiscountType.Percent)
  discountType: DiscountType // Loại giảm giá

  @Expose()
  @Transform(({ value }) => value || 0)
  actualPrice: number // Giá thực tế

  @Expose()
  quantity: number

  @Expose() // Hướng dẫn sử dụng
  hintUsage: string | null

  @Expose({ groups: ['ALL'] })
  @Type(() => Invoice)
  invoice?: Invoice

  @Expose({ groups: ['ALL'] })
  @Type(() => ProductBatch)
  productBatch?: ProductBatch

  @Expose({ groups: ['ALL'] })
  @Type(() => Procedure)
  procedure?: Procedure

  @Expose({ groups: ['ALL'] })
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

  static blank(): InvoiceItem {
    const instance = InvoiceItem.fromInstance(new InvoiceItem())
    return instance
  }

  static fromPlain(plain: Record<string, any>): InvoiceItem {
    return plainToInstance(InvoiceItem, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromPlains(plains: Record<string, any>[]): InvoiceItem[] {
    return plainToInstance(InvoiceItem, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromInstance(instance: InvoiceItem): InvoiceItem {
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['COPY'],
    })
  }

  static fromInstances(instances: InvoiceItem[]): InvoiceItem[] {
    return instanceToInstance(instances, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['COPY'],
    })
  }

  static clone(root: InvoiceItem): InvoiceItem {
    const ins = InvoiceItem.fromInstance(root)
    if (ins.type === InvoiceItemType.Procedure) {
      if (root.procedure) {
        ins.procedure = Procedure.fromInstance(root.procedure)
      }
    }
    if (ins.type === InvoiceItemType.ProductBatch) {
      if (root.productBatch) {
        ins.productBatch = ProductBatch.fromInstance(root.productBatch)
        if (root.productBatch.product) {
          ins.productBatch.product = Product.fromInstance(root.productBatch?.product)
        }
      }
    }
    return ins
  }
}
