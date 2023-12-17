import {
  Expose,
  instanceToInstance,
  instanceToPlain,
  plainToInstance,
  Transform,
  TransformationType,
  Type,
} from 'class-transformer'
import type { UnitType } from '../enum'
import { ProductBatch } from './product-batch.model'
import { ProductMovement } from './product-movement.model'

export class Product {
  @Expose({ groups: ['ALL', 'COPY'] })
  id: number

  @Expose({ groups: ['ALL', 'COPY'] })
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
  @Transform(({ value, type }) => (value != null ? value : 1))
  isActive: 1 | 0 // Trạng thái

  @Expose({ groups: ['ALL'] })
  @Type(() => ProductBatch)
  productBatches: ProductBatch[]

  @Expose({ groups: ['ALL'] })
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

  static fromPlain(plain: Record<string, any>): Product {
    return plainToInstance(Product, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromPlains(plains: Record<string, any>[]): Product[] {
    return plainToInstance(Product, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromInstance(instance: Product): Product {
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['COPY'],
    })
  }

  static toPlain(instance: Product, type: 'CREATE' | 'UPDATE'): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }
}
