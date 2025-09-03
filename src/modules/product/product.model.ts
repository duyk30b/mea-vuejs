import { Batch } from '../batch/batch.model'
import { Discount } from '../discount'
import {
  ProductType,
  SplitBatchByCostPrice,
  SplitBatchByDistributor,
  SplitBatchByExpiryDate,
  SplitBatchByWarehouse,
  type UnitType,
} from '../enum'
import { Position } from '../position'
import { ProductGroup } from '../product-group'

export class Product {
  id: number
  productCode: string // Tên biệt dược
  brandName: string // Tên biệt dược
  substance: string // Hoạt chất

  productGroupId: number
  unit: string
  route: string // Đường dùng: ... Ấn Độ, Ý, Pháp, ...
  source: string // Nguồn gốc: ... Ấn Độ, Ý, Pháp, ...
  image: string
  hintUsage: string // Gợi ý cách sử dụng

  quantity: number
  costPrice: number
  wholesalePrice: number // Giá bán sỉ
  retailPrice: number // Giá bán lẻ

  warehouseIds: string
  warehouseIdList: number[] // [] là không quản lý kho, [0] là tất cả kho

  productType: ProductType
  splitBatchByWarehouse: SplitBatchByWarehouse
  splitBatchByDistributor: SplitBatchByDistributor
  splitBatchByExpiryDate: SplitBatchByExpiryDate
  splitBatchByCostPrice: SplitBatchByCostPrice

  isActive: 1 | 0 // Trạng thái
  updatedAt: number | string | Date

  batchList?: Batch[]
  productGroup?: ProductGroup

  positionRequestListCommon: Position[]
  positionRequestList: Position[]

  discountList?: Discount[]
  discountListExtra?: Discount[]

  get unitObject(): UnitType[] {
    try {
      return JSON.parse(this.unit || JSON.stringify([{ name: '', rate: 1, default: true }]))
    } catch (error) {
      return []
    }
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

  get discountApply() {
    const discountList = [...(this.discountList || []), ...(this.discountListExtra || [])]
    const discountFilter = discountList.filter((i) => Discount.canApplyNow(i))
    discountFilter.sort((a, b) => {
      if (a.priority > b.priority) return -1
      if (a.priority < b.priority) return 1
      if (a.priority == b.priority) return a.discountInteractId == 0 ? 1 : -1
      return -1
    })
    return discountFilter[0]
  }

  public getUnitNameByRate(rate: number) {
    return this.unitObject?.find((u) => u.rate === rate)?.name || ''
  }

  static init(): Product {
    const ins = new Product()
    ins.id = 0
    ins.productCode = ''
    ins.quantity = 0
    ins.costPrice = 0
    ins.wholesalePrice = 0
    ins.retailPrice = 0
    ins.unit = JSON.stringify([{ name: '', rate: 1, default: true }])
    ins.productGroupId = 0

    ins.warehouseIds = JSON.stringify([0])
    ins.warehouseIdList = [0]

    ins.productType = ProductType.Basic

    ins.splitBatchByWarehouse = SplitBatchByWarehouse.Inherit
    ins.splitBatchByDistributor = SplitBatchByDistributor.Inherit
    ins.splitBatchByExpiryDate = SplitBatchByExpiryDate.Inherit
    ins.splitBatchByCostPrice = SplitBatchByCostPrice.Inherit
    ins.isActive = 1
    return ins
  }

  static blank(): Product {
    const ins = Product.init()
    ins.batchList = []
    ins.positionRequestList = []
    ins.positionRequestListCommon = []
    ins.discountList = []
    ins.discountListExtra = []

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
    if (target.batchList) {
      target.batchList = Batch.basicList(target.batchList)
    }
    if (target.positionRequestList) {
      target.positionRequestList = Position.basicList(target.positionRequestList)
    }
    if (target.positionRequestListCommon) {
      target.positionRequestListCommon = Position.basicList(target.positionRequestListCommon)
    }
    if (target.discountList) {
      target.discountList = Discount.basicList(target.discountList)
    }
    if (target.discountListExtra) {
      target.discountListExtra = Discount.basicList(target.discountListExtra)
    }

    try {
      target.warehouseIdList = JSON.parse(target.warehouseIds)
    } catch (error) {
      target.warehouseIdList = []
    }
    return target
  }

  static fromList(sourceList: Product[]): Product[] {
    return sourceList.map((i) => Product.from(i))
  }

  static equal(a: Product, b: Product) {
    if (a.id != b.id) return false
    if (a.productCode != b.productCode) return false
    if (a.brandName != b.brandName) return false
    if (a.substance != b.substance) return false

    if (a.productGroupId != b.productGroupId) return false
    if (a.unit != b.unit) return false
    if (a.route != b.route) return false
    if (a.source != b.source) return false
    if (a.image != b.image) return false
    if (a.hintUsage != b.hintUsage) return false

    if (a.quantity != b.quantity) return false
    if (a.costPrice != b.costPrice) return false
    if (a.wholesalePrice != b.wholesalePrice) return false
    if (a.retailPrice != b.retailPrice) return false

    if (a.warehouseIds != b.warehouseIds) return false
    if (a.isActive != b.isActive) return false
    if (a.updatedAt != b.updatedAt) return false
    return true
  }
}
