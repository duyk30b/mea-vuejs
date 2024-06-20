import { Expose, instanceToPlain, plainToInstance, Type } from 'class-transformer'
import { FROM_PLAIN } from '../_base/base-expose'
import { BaseModel } from '../base.model'
import { Batch } from '../batch/batch.model'
import { Customer } from '../customer'
import { Distributor } from '../distributor'
import type { VoucherType } from '../enum'
import { Invoice } from '../invoice'
import { Product } from '../product'
import { Receipt } from '../receipt'
import { Visit } from '../visit'

export class BatchMovement extends BaseModel {
  @Expose({ toClassOnly: true })
  productId: number

  @Expose({ toClassOnly: true })
  batchId: number

  @Expose()
  voucherType: VoucherType

  @Expose()
  voucherId: number

  @Expose()
  contactId: number

  @Expose()
  isRefund: boolean

  @Expose()
  openQuantity: number // Số lượng ban đầu

  @Expose()
  quantity: number // Số lượng +/-

  @Expose()
  unitRate: number

  @Expose()
  closeQuantity: number // Số lượng sau thay đổi

  @Expose()
  actualPrice: number // Giá

  @Expose()
  expectedPrice: number // Giá

  @Expose()
  costAmount: number // Vốn

  @Expose()
  createdAt: number

  @Expose({ toClassOnly: true })
  @Type(() => Batch)
  batch?: Batch

  @Expose({ toClassOnly: true })
  @Type(() => Product)
  product?: Product

  @Expose({ toClassOnly: true })
  @Type(() => Receipt)
  receipt?: Receipt

  @Expose({ toClassOnly: true })
  @Type(() => Invoice)
  invoice?: Invoice

  @Expose({ toClassOnly: true })
  @Type(() => Visit)
  visit?: Visit

  @Expose({ toClassOnly: true })
  @Type(() => Distributor)
  distributor?: Distributor

  @Expose({ toClassOnly: true })
  @Type(() => Customer)
  customer?: Customer

  get unitQuantity() {
    return this.quantity / this.unitRate
  }

  get unitActualPrice() {
    return this.actualPrice * this.unitRate
  }

  get unitExpectedPrice() {
    return this.expectedPrice * this.unitRate
  }

  get unitName() {
    return this.product!.getUnitNameByRate(this.unitRate) || ''
  }

  static fromPlain(plain: Record<string, any>): BatchMovement {
    return plainToInstance(BatchMovement, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(plains: Record<string, any>[]): BatchMovement[] {
    return plainToInstance(BatchMovement, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static toPlain(instance: BatchMovement): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}
