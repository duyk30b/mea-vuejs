import { Expose, instanceToInstance, plainToInstance, Transform, Type } from 'class-transformer'
import { BaseModel } from '../base.model'
import { Customer } from '../customer'
import { DiscountType } from '../enum'
import { Procedure } from '../procedure'
import { ProductBatch } from '../product'
import { Invoice } from './invoice.model'

export enum InvoiceItemType {
  ProductBatch = 1,
  Procedure = 2,
}

export class InvoiceItem extends BaseModel {
  @Expose({ toClassOnly: true })
  invoiceId: number

  @Expose({ toClassOnly: true })
  customerId: number

  @Expose()
  referenceId: number

  @Expose()
  type: InvoiceItemType

  @Expose()
  unit: { name: string; rate: number } = { name: '', rate: 1 }

  @Expose()
  @Transform(({ value }) => value || 0)
  costPrice: number // Giá cost

  @Expose()
  expectedPrice: number = 0 // Giá dự kiến

  @Expose()
  @Transform(({ value }) => value || 0)
  discountMoney: number = 0 // tiền giảm giá

  @Expose()
  @Transform(({ value }) => value || 0)
  discountPercent: number = 0 // % giảm giá

  @Expose()
  discountType: DiscountType = DiscountType.Percent // Loại giảm giá

  @Expose()
  @Transform(({ value }) => value || 0)
  actualPrice: number = 0 // Giá thực tế

  @Expose()
  quantity: number = 0

  @Expose() // Hướng dẫn sử dụng
  hintUsage: string | null

  @Expose({ toClassOnly: true })
  @Type(() => Invoice)
  invoice?: Invoice

  @Expose({ toClassOnly: true })
  @Type(() => ProductBatch)
  productBatch: ProductBatch

  @Expose({ toClassOnly: true })
  @Type(() => Procedure)
  procedure: Procedure

  @Expose({ toClassOnly: true })
  @Type(() => Customer)
  customer?: Customer

  static blank(): InvoiceItem {
    return new InvoiceItem()
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
      ignoreDecorators: true,
    })
  }

  static fromInstances(instances: InvoiceItem[]): InvoiceItem[] {
    return instanceToInstance(instances, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      ignoreDecorators: true,
    })
  }

  static fromObject(object: InvoiceItem): InvoiceItem {
    const instance = new InvoiceItem()
    Object.assign(instance, object)
    return instance
  }
}
