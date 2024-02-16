import {
  Expose,
  instanceToInstance,
  instanceToPlain,
  plainToInstance,
  Transform,
  TransformationType,
  Type,
} from 'class-transformer'
import { FROM_INSTANCE, FROM_PLAIN, USER_CREATE, USER_UPDATE } from '../_base/base-expose'
import type { UnitType } from '../enum'
import { ProductBatch } from '../product-batch/product-batch.model'
import { ProductMovement } from './product-movement.model'

export class Product {
  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  id: number

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  quantity: number

  @Expose()
  brandName: string // Tên biệt dược

  @Expose()
  substance: string // Hoạt chất

  @Expose()
  group: string // Nhóm sản phẩm: kháng sinh, dinh dưỡng ...

  @Expose()
  @Transform(({ value, type }) => {
    if (type === TransformationType.PLAIN_TO_CLASS) {
      return JSON.parse(value || JSON.stringify([{ name: '', rate: 1, default: true }]))
    } else if (type === TransformationType.CLASS_TO_PLAIN) {
      return JSON.stringify(value || [{ name: '', rate: 1, default: true }])
    } else if (type === TransformationType.CLASS_TO_CLASS) {
      return JSON.parse(JSON.stringify(value || [{ name: '', rate: 1, default: true }]))
    }
    return value
  })
  unit: UnitType[]

  @Expose()
  route: string // Đường dùng: ... Ấn Độ, Ý, Pháp, ...

  @Expose()
  source: string // Nguồn gốc: ... Ấn Độ, Ý, Pháp, ...

  @Expose()
  image: string

  @Expose()
  hintUsage: string // Gợi ý cách sử dụng

  @Expose()
  isActive: 1 | 0 // Trạng thái

  @Expose({ groups: [FROM_PLAIN] })
  createdAt: number

  @Expose({ groups: [FROM_PLAIN] })
  updatedAt: number

  @Expose({ groups: [FROM_PLAIN] })
  deletedAt: number

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => ProductBatch)
  productBatches: ProductBatch[]

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => ProductMovement)
  productMovements: ProductMovement[]

  get unitDefault() {
    const unitDefault = this.unit?.find((u) => !!u.default)
    return unitDefault || this.unit?.[0] || { name: '', rate: 1, default: true }
  }

  get unitName() {
    return this.unitDefault.name
  }

  get unitBasicName() {
    const unitBasic = this.unit?.find((u) => u.rate === 1) || { name: '', rate: 1 }
    return unitBasic.name
  }

  get unitRate() {
    return this.unitDefault.rate
  }

  get unitQuantity() {
    return Number(((this.quantity || 0) / this.unitRate).toFixed(3))
  }

  static init(): Product {
    const ins = new Product()
    ins.id = 0
    ins.unit = [{ name: '', rate: 1, default: true }]
    ins.isActive = 1
    return ins
  }

  static blank(): Product {
    const ins = Product.init()
    ins.productBatches = []
    ins.productMovements = []
    return ins
  }

  static fromObject(object: Partial<Product>) {
    const ins = new Product()
    Object.assign(ins, object)
    return ins
  }

  static fromObjects(objects: Partial<Product>[]): Product[] {
    return objects.map((i) => Product.fromObject(i))
  }

  static fromPlain(plain: Record<string, any>): Product {
    return plainToInstance(Product, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(plains: Record<string, any>[]): Product[] {
    return plainToInstance(Product, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromInstance(instance: Product): Product {
    if (import.meta.env.MODE === 'development' && instance?.constructor.name !== '_Product') {
      throw new Error('Product.fromInstance error: Instance must be from class Product')
    }
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_INSTANCE],
    })
  }

  static toPlain(
    instance: Product,
    type: typeof USER_CREATE | typeof USER_UPDATE
  ): Record<string, any> {
    if (import.meta.env.MODE === 'development' && instance?.constructor.name !== '_Product') {
      throw new Error('Product.fromInstance error: Instance must be from class Product')
    }
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }
}
