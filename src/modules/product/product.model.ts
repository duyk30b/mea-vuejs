import { Expose, instanceToInstance, instanceToPlain, plainToInstance, Type } from 'class-transformer'
import { BaseModel } from '../base.model'
import { ProductBatch } from './product-batch.model'
import { ProductMovement } from './product-movement.model'

export class Product extends BaseModel {
  @Expose({ toClassOnly: true })
  quantity: number = 0

  @Expose()
  brandName: string = '' // Tên biệt dược

  @Expose()
  substance?: string = '' // Hoạt chất

  @Expose()
  group: string = '' // Nhóm thuốc: kháng sinh, dinh dưỡng ...

  @Expose()
  unit: { name: string; rate: number; default?: boolean }[] = [{ name: '', rate: 1 }]

  @Expose()
  route: string = '' // Đường dùng: ... Ấn Độ, Ý, Pháp, ...

  @Expose()
  source: string = '' // Nguồn gốc: ... Ấn Độ, Ý, Pháp, ...

  @Expose()
  image: string = ''

  @Expose()
  hintUsage: string = '' // Gợi ý cách sử dụng

  @Expose()
  isActive: boolean = true // Trạng thái

  @Expose({ toClassOnly: true })
  @Type(() => ProductBatch)
  productBatches: ProductBatch[] = []

  @Expose({ toClassOnly: true })
  @Type(() => ProductMovement)
  productMovements: ProductMovement[] = []

  static blank(): Product {
    const product = new Product()
    return product
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
      ignoreDecorators: true,
    })
  }

  static toPlain(instance: Product): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}
