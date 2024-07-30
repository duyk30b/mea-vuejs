import { Batch } from '../batch/batch.model'
import type { UnitType } from '../enum'
import { ProductGroup } from '../product-group'

export class Product {
  id: number
  brandName: string // Tên biệt dược
  substance: string // Hoạt chất
  lotNumber: string // Lô sản phẩm
  expiryDate?: number
  quantity: number
  costAmount: number // Tổng vốn
  costPrice: number // Giá nhập
  wholesalePrice: number // Giá bán sỉ
  retailPrice: number // Giá bán lẻ
  hasManageQuantity: 0 | 1
  hasManageBatches: 0 | 1
  productGroupId: number
  unit: string
  route: string // Đường dùng: ... Ấn Độ, Ý, Pháp, ...
  source: string // Nguồn gốc: ... Ấn Độ, Ý, Pháp, ...
  image: string
  hintUsage: string // Gợi ý cách sử dụng

  isActive: 1 | 0 // Trạng thái
  updatedAt: number

  batchList?: Batch[]
  productGroup?: ProductGroup

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

  get costPriceAverage() {
    if (this.quantity === 0) return this.costPrice
    return Math.floor(this.costAmount / this.quantity)
  }

  public getUnitNameByRate(rate: number) {
    return this.unitObject?.find((u) => u.rate === rate)?.name || ''
  }

  static init(): Product {
    const ins = new Product()
    ins.id = 0
    ins.hasManageBatches = 0
    ins.hasManageQuantity = 1
    ins.quantity = 0
    ins.costPrice = 0
    ins.wholesalePrice = 0
    ins.retailPrice = 0
    ins.unit = JSON.stringify([{ name: '', rate: 1, default: true }])
    ins.productGroupId = 0

    ins.isActive = 1
    return ins
  }

  static blank(): Product {
    const ins = Product.init()
    ins.batchList = []

    return ins
  }

  static basic(source: Product) {
    const target = new Product()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Product[]): Product[] {
    return sources.map((i) => Product.basic(i))
  }

  static from(source: Product) {
    const target = Product.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'productGroup')) {
      target.productGroup = target.productGroup
        ? ProductGroup.basic(target.productGroup)
        : target.productGroup
    }
    if (source.batchList) {
      target.batchList = Batch.basicList(source.batchList)
    }
    return target
  }

  static fromList(sourceList: Product[]): Product[] {
    return sourceList.map((i) => Product.from(i))
  }
}
