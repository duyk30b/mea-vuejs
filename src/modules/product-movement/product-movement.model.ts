import { Expose, instanceToPlain, plainToInstance, Type } from 'class-transformer'
import { FROM_PLAIN } from '../_base/base-expose'
import { BaseModel } from '../base.model'
import { Customer } from '../customer'
import { Distributor } from '../distributor'
import type { VoucherType } from '../enum'
import { Invoice } from '../invoice'
import { Product } from '../product'
import { Receipt } from '../receipt'
import { Visit } from '../visit'

export class ProductMovement extends BaseModel {
  @Expose({ toClassOnly: true })
  productId: number

  @Expose()
  voucherId: number

  @Expose()
  contactId: number

  @Expose()
  voucherType: VoucherType

  @Expose()
  isRefund: 0 | 1

  @Expose()
  openQuantity: number // Số lượng ban đầu

  @Expose()
  quantity: number // Số lượng +/-

  @Expose()
  closeQuantity: number // Số lượng sau thay đổi

  @Expose()
  unitRate: number

  @Expose()
  actualPrice: number // Giá

  @Expose()
  expectedPrice: number // Giá

  @Expose()
  openCostAmount: number // Vốn

  @Expose()
  costAmount: number // Vốn

  @Expose()
  closeCostAmount: number // Vốn

  @Expose()
  createdAt: number

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
