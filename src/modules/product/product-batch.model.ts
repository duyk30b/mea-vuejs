import { Expose, instanceToInstance, instanceToPlain, plainToInstance, Type } from 'class-transformer'
import { BaseModel } from '../base.model'
import { Product } from './product.model'

export class ProductBatch extends BaseModel {
  @Expose({ groups: ['ALL', 'CREATE'] })
  productId: number

  @Expose()
  batch: string = '' // Lô sản phẩm

  @Expose()
  expiryDate?: number

  @Expose({ groups: ['ALL', 'CREATE'] })
  costPrice: number = 0 // Giá nhập

  @Expose({ toClassOnly: true })
  quantity: number = 0

  @Expose()
  wholesalePrice: number = 0 // Giá bán sỉ

  @Expose()
  retailPrice: number = 0 // Giá bán lẻ

  @Expose()
  isActive: boolean = true // Trạng thái

  @Expose({ toClassOnly: true })
  @Type(() => Product)
  product?: Product

  static blank() {
    const batch = new ProductBatch()
    batch.id = 0
    return batch
  }

  static fromPlain(plain: Record<string, any>): ProductBatch {
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
      ignoreDecorators: true,
    })
  }

  static toPlain(instance: ProductBatch, type: 'CREATE' | 'UPDATE'): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }
}
