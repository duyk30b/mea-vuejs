import {
  Expose,
  instanceToInstance,
  instanceToPlain,
  plainToInstance,
  Type,
} from 'class-transformer'
import { FROM_INSTANCE, FROM_PLAIN, USER_CREATE, USER_UPDATE } from '../_base/base-expose'
import { Product } from '../product/product.model'

export class ProductBatch {
  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  id: number

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE, USER_CREATE] })
  productId: number

  @Expose()
  batch: string // Lô sản phẩm

  @Expose()
  expiryDate?: number

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE, USER_CREATE] })
  costPrice: number // Giá nhập

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  quantity: number

  @Expose()
  wholesalePrice: number // Giá bán sỉ

  @Expose()
  retailPrice: number // Giá bán lẻ

  @Expose({ groups: [FROM_PLAIN] })
  createdAt: number

  @Expose({ groups: [FROM_PLAIN] })
  updatedAt: number

  @Expose({ groups: [FROM_PLAIN] })
  deletedAt: number

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Product)
  product?: Product

  get unitQuantity() {
    return Number(((this.quantity || 0) / this.product!.unitRate).toFixed(3))
  }

  get unitCostPrice() {
    return this.costPrice * this.product!.unitRate
  }

  get unitRetailPrice() {
    return this.retailPrice * this.product!.unitRate
  }

  get unitWholesalePrice() {
    return this.wholesalePrice * this.product!.unitRate
  }

  get totalCostPrice() {
    return this.costPrice * this.quantity
  }

  get totalRetailPrice() {
    return this.retailPrice * this.quantity
  }

  get totalWholesalePrice() {
    return this.wholesalePrice * this.quantity
  }

  set unitCostPrice(data) {
    this.costPrice = data / this.product!.unitRate
  }

  set unitRetailPrice(data) {
    this.retailPrice = data / this.product!.unitRate
  }

  set unitWholesalePrice(data) {
    this.wholesalePrice = data / this.product!.unitRate
  }

  static init() {
    const ins = new ProductBatch()
    ins.id = 0
    ins.batch = ''
    ins.costPrice = 0
    ins.quantity = 0
    ins.wholesalePrice = 0
    ins.retailPrice = 0
    return ins
  }

  static blank() {
    const ins = ProductBatch.init()
    ins.product = Product.init()
    return ins
  }

  // lấy từ 1 object có cấu trúc giống 100%, nhưng nó chỉ là object, ko phải class như object lấy từ indexedDB
  static fromObject(object: Partial<ProductBatch>) {
    const ins = new ProductBatch()
    Object.assign(ins, object)
    return ins
  }

  static fromObjects(objects: Partial<ProductBatch>[]) {
    return objects.map((i) => ProductBatch.fromObject(i))
  }

  // lấy từ giá trị cơ bản từ API
  static fromPlain(plain: Record<string, any> = {}): ProductBatch {
    return plainToInstance(ProductBatch, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(plains: Record<string, any>[]): ProductBatch[] {
    return plainToInstance(ProductBatch, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  // lấy từ 1 instance khác
  static fromInstance(instance: ProductBatch): ProductBatch {
    if (import.meta.env.MODE === 'development' && instance?.constructor.name !== '_ProductBatch') {
      throw new Error('ProductBatch.fromInstance error: Instance must be from class ProductBatch')
    }
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_INSTANCE],
    })
  }

  static fromInstances(instances: ProductBatch[]): ProductBatch[] {
    return instances.map((i) => ProductBatch.fromInstance(i))
  }

  static toPlain(
    instance: ProductBatch,
    type: typeof USER_CREATE | typeof USER_UPDATE
  ): Record<string, any> {
    if (import.meta.env.MODE === 'development' && instance?.constructor.name !== '_ProductBatch') {
      throw new Error('ProductBatch.fromInstance error: Instance must be from class ProductBatch')
    }
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }

  static clone(instance: ProductBatch): ProductBatch {
    const batch = ProductBatch.fromInstance(instance)
    if (instance.product) {
      batch.product = Product.fromInstance(instance.product)
    }
    return batch
  }
}
