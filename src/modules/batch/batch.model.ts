import {
  Expose,
  instanceToInstance,
  instanceToPlain,
  plainToInstance,
  Type,
} from 'class-transformer'
import { FROM_INSTANCE, FROM_PLAIN, USER_CREATE, USER_UPDATE } from '../_base/base-expose'
import { Product } from '../product/product.model'

export class Batch {
  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  id: number

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE, USER_CREATE] })
  productId: number

  @Expose()
  lotNumber: string // Lô sản phẩm

  @Expose()
  expiryDate?: number

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE, USER_CREATE, USER_UPDATE] })
  costPrice: number // Giá nhập

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  costAmount: number // Tổng tiền nhập còn lại

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  quantity: number

  @Expose({ groups: [FROM_PLAIN] })
  createdAt: number

  @Expose({ groups: [FROM_PLAIN] })
  updatedAt: number

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Product)
  product?: Product

  get unitQuantity() {
    return Number(((this.quantity || 0) / this.product!.unitRate).toFixed(3))
  }

  get unitCostPrice() {
    return this.costPrice * this.product!.unitRate
  }

  set unitCostPrice(data) {
    this.costPrice = data / this.product!.unitRate
  }

  static init() {
    const ins = new Batch()
    ins.id = 0
    ins.lotNumber = ''
    ins.costPrice = 0
    ins.quantity = 0
    return ins
  }

  static blank() {
    const ins = Batch.init()
    ins.product = Product.init()
    return ins
  }

  // lấy từ 1 object có cấu trúc giống 100%, nhưng nó chỉ là object, ko phải class như object lấy từ indexedDB
  static fromObject(object: Partial<Batch>) {
    const ins = new Batch()
    Object.assign(ins, object)
    return ins
  }

  static fromObjects(objects: Partial<Batch>[]) {
    return objects.map((i) => Batch.fromObject(i))
  }

  // lấy từ giá trị cơ bản từ API
  static fromPlain(plain: Record<string, any> = {}): Batch {
    return plainToInstance(Batch, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(plains: Record<string, any>[]): Batch[] {
    return plainToInstance(Batch, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  // lấy từ 1 instance khác
  static fromInstance(instance: Batch): Batch {
    if (import.meta.env.MODE === 'development' && instance?.constructor.name !== '_Batch') {
      throw new Error('Batch.fromInstance error: Instance must be from class Batch')
    }
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_INSTANCE],
    })
  }

  static fromInstances(instances: Batch[]): Batch[] {
    return instances.map((i) => Batch.fromInstance(i))
  }

  static toPlain(
    instance: Batch,
    type: typeof USER_CREATE | typeof USER_UPDATE
  ): Record<string, any> {
    if (import.meta.env.MODE === 'development' && instance?.constructor.name !== '_Batch') {
      throw new Error('Batch.fromInstance error: Instance must be from class Batch')
    }
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }

  static clone(instance: Batch): Batch {
    const batch = Batch.fromInstance(instance)
    if (instance.product) {
      batch.product = Product.fromInstance(instance.product)
    }
    return batch
  }
}
