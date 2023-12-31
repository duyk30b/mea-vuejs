import {
  Expose,
  instanceToInstance,
  instanceToPlain,
  plainToInstance,
  Type,
} from 'class-transformer'
import { Product } from '../product/product.model'

export class ProductBatch {
  @Expose({ groups: ['ALL', 'COPY'] })
  id: number

  @Expose({ groups: ['ALL', 'COPY', 'CREATE'] })
  productId: number

  @Expose()
  batch: string // Lô sản phẩm

  @Expose()
  expiryDate?: number

  @Expose({ groups: ['ALL', 'COPY', 'CREATE'] })
  costPrice: number // Giá nhập

  @Expose({ groups: ['ALL', 'COPY'] })
  quantity: number

  @Expose()
  wholesalePrice: number // Giá bán sỉ

  @Expose()
  retailPrice: number // Giá bán lẻ

  @Expose()
  isActive: 1 | 0 // Trạng thái

  @Expose({ groups: ['ALL'] })
  createdAt: number

  @Expose({ groups: ['ALL'] })
  updatedAt: number

  @Expose({ groups: ['ALL'] })
  deletedAt: number

  @Expose({ groups: ['ALL'] })
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
    ins.isActive = 1
    return ins
  }

  static blank() {
    const ins = ProductBatch.init()
    ins.product = Product.init()
    return ins
  }

  static fromPlain(plain: Record<string, any> = {}): ProductBatch {
    return plainToInstance(ProductBatch, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromPlains(plains: Record<string, any>[]): ProductBatch[] {
    return plainToInstance(ProductBatch, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromInstance(instance: ProductBatch): ProductBatch {
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['COPY'],
    })
  }

  static fromInstances(instance: ProductBatch[]): ProductBatch[] {
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['COPY'],
    })
  }

  static toPlain(instance: ProductBatch, type: 'CREATE' | 'UPDATE'): Record<string, any> {
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
