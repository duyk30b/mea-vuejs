import {
  Expose,
  instanceToInstance,
  instanceToPlain,
  plainToInstance,
  Type,
} from 'class-transformer'
import { FROM_INSTANCE, FROM_PLAIN, USER_CREATE, USER_UPDATE } from '../_base/base-expose'
import { useScreenStore } from '../_me/screen.store'
import { Batch } from '../batch/batch.model'
import type { UnitType } from '../enum'

export class Product {
  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  id: number

  @Expose()
  brandName: string // Tên biệt dược

  @Expose()
  substance: string // Hoạt chất

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  quantity: number

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  costAmount: number // Tổng vốn

  @Expose()
  costPrice: number // Giá nhập

  @Expose()
  wholesalePrice: number // Giá bán sỉ

  @Expose()
  retailPrice: number // Giá bán lẻ

  @Expose()
  hasManageQuantity: 0 | 1

  @Expose()
  hasManageBatches: 0 | 1

  @Expose()
  group: string // Nhóm sản phẩm: kháng sinh, dinh dưỡng ...

  @Expose()
  unit: string

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

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  updatedAt: number

  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  deletedAt: number | null

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Batch)
  batchList?: Batch[]

  get unitObject(): UnitType[] {
    return JSON.parse(this.unit || JSON.stringify([{ name: '', rate: 1, default: true }]))
  }

  set unitObject(data) {
    this.unit = JSON.stringify(data || [{ name: '', rate: 1, default: true }])
  }

  get unitDefault() {
    const unitDefault = this.unitObject?.find((u) => !!u.default)
    return unitDefault || this.unitObject?.[0] || { name: '', rate: 1, default: true }
  }

  get unitDefaultName() {
    return this.unitDefault.name
  }

  get unitDefaultRate() {
    return this.unitDefault.rate || 1
  }

  get unitBasic() {
    return this.unitObject?.find((u) => u.rate === 1) || { name: '', rate: 1 }
  }

  get unitBasicName() {
    return this.unitBasic.name
  }

  get unitBasicRate() {
    return this.unitBasic.rate
  }

  get unitQuantity() {
    return Number(((this.quantity || 0) / this.unitDefaultRate).toFixed(3))
  }

  get unitCostPrice() {
    return this.costPrice * this.unitDefaultRate
  }

  get unitRetailPrice() {
    return this.retailPrice * this.unitDefaultRate
  }

  get unitWholesalePrice() {
    return this.wholesalePrice * this.unitDefaultRate
  }

  set unitCostPrice(data) {
    this.costPrice = data / this.unitDefaultRate
  }

  set unitRetailPrice(data) {
    this.retailPrice = data / this.unitDefaultRate
  }

  set unitWholesalePrice(data) {
    this.wholesalePrice = data / this.unitDefaultRate
  }

  public getUnitNameByRate(rate: number) {
    return this.unitObject?.find((u) => u.rate === rate)?.name || ''
  }

  static init(): Product {
    const ins = new Product()
    ins.id = 0
    ins.hasManageQuantity = 1
    ins.hasManageBatches = 0
    ins.costPrice = 0
    ins.wholesalePrice = 0
    ins.retailPrice = 0
    ins.unit = JSON.stringify([{ name: '', rate: 1, default: true }])
    ins.isActive = 1
    return ins
  }

  static blank(): Product {
    const screenStore = useScreenStore()

    const ins = Product.init()
    ins.batchList = []
    ins.hasManageBatches = Number(screenStore.SYSTEM_SETTING.hasManageBatches) as 0 | 1
    ins.hasManageQuantity = Number(screenStore.SYSTEM_SETTING.hasManageQuantity) as 0 | 1
    return ins
  }

  static toBasic(root: Product) {
    const ins = new Product()
    Object.assign(ins, root)
    delete ins.batchList
    return ins
  }

  static toBasics(roots: Product[]) {
    return roots.map((i) => Product.toBasic(i))
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

  static clone(instance: Product): Product {
    const product = Product.fromInstance(instance)
    if (instance.batchList) {
      product.batchList = instance.batchList.map((batch) => {
        return Batch.fromInstance(batch)
      })
    }
    return product
  }
}
