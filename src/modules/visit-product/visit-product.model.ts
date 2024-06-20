import {
  Expose,
  Type,
  instanceToInstance,
  instanceToPlain,
  plainToInstance,
} from 'class-transformer'
import { FROM_INSTANCE, FROM_PLAIN, USER_CREATE, USER_UPDATE } from '../_base/base-expose'
import { BatchMovement } from '../batch-movement/batch-movement.model'
import type { DiscountType } from '../enum'
import { Product } from '../product'
import { VisitBatch } from '../visit-batch'

export class VisitProduct {
  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  id: number

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  visitId: number

  @Expose()
  productId: number

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  isSent: number

  @Expose()
  unitRate: number

  @Expose()
  quantityPrescription: number

  @Expose()
  quantity: number

  @Expose()
  costAmount: number // Tổng giá cost

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

  @Expose() // Hướng dẫn sử dụng
  hintUsage: string | null

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Product)
  product?: Product | null

  get unitName() {
    return this.product?.getUnitNameByRate(this.unitRate) || ''
  }

  get unitQuantity() {
    return Number((this.quantity / this.unitRate).toFixed(3))
  }

  get unitQuantityPrescription() {
    return Number((this.quantityPrescription / this.unitRate).toFixed(3))
  }

  get unitExpectedPrice() {
    return this.expectedPrice * this.unitRate
  }

  get unitDiscountMoney() {
    return this.discountMoney * this.unitRate
  }

  get unitActualPrice() {
    return this.actualPrice * this.unitRate
  }

  set unitQuantity(data: number) {
    this.quantity = data * this.unitRate
  }

  set unitQuantityPrescription(data: number) {
    this.quantityPrescription = data * this.unitRate
  }

  set unitExpectedPrice(data: number) {
    this.expectedPrice = data / this.unitRate
  }

  set unitDiscountMoney(data: number) {
    this.discountMoney = data / this.unitRate
  }

  set unitActualPrice(data: number) {
    this.actualPrice = data / this.unitRate
  }

  static init(): VisitProduct {
    const instance = new VisitProduct()
    instance.id = 0
    instance.quantity = 0
    instance.unitRate = 1
    instance.quantityPrescription = 0
    instance.hintUsage = ''
    return instance
  }

  static blank(): VisitProduct {
    const instance = VisitProduct.init()
    return instance
  }

  static toBasic(root: VisitProduct) {
    const ins = new VisitProduct()
    Object.assign(ins, root)
    delete ins.product
    return ins
  }

  static fromPlain(dto: Record<string, any>): VisitProduct {
    return plainToInstance(VisitProduct, dto, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(dto: Record<string, any>[]): VisitProduct[] {
    return plainToInstance(VisitProduct, dto, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromInstance(instance: VisitProduct): VisitProduct {
    if (import.meta.env.MODE === 'development' && instance?.constructor.name !== '_VisitProduct') {
      throw new Error('VisitProduct.fromInstance error: Instance must be from class VisitProduct')
    }
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_INSTANCE],
    })
  }

  static fromInstances(instances: VisitProduct[]): VisitProduct[] {
    return instances.map((i) => VisitProduct.fromInstance(i))
  }

  static toPlain(
    instance: VisitProduct,
    type: typeof USER_CREATE | typeof USER_UPDATE
  ): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }

  static toPlains(
    instances: VisitProduct[],
    type: typeof USER_CREATE | typeof USER_UPDATE
  ): Record<string, any> {
    return instances.map((i) => VisitProduct.toPlain(i, type))
  }

  static clone(root: VisitProduct): VisitProduct {
    const result = new VisitProduct()
    Object.assign(result, root)

    if (root.product) {
      result.product = new Product()
      Object.assign(result.product, root.product)
    }
    return result
  }

  static cloneList(roots: VisitProduct[]): VisitProduct[] {
    return roots.map((i) => VisitProduct.clone(i))
  }
}
