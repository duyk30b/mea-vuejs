import { useSettingStore } from '../_me/setting.store'
import { Batch } from '../batch/batch.model'
import type { UnitType } from '../enum'

export class Product {
  id: number
  brandName: string // Tên biệt dược
  substance: string // Hoạt chất
  quantity: number
  costAmount: number // Tổng vốn
  costPrice: number // Giá nhập
  wholesalePrice: number // Giá bán sỉ
  retailPrice: number // Giá bán lẻ
  hasManageQuantity: 0 | 1
  hasManageBatches: 0 | 1
  group: string // Nhóm sản phẩm: kháng sinh, dinh dưỡng ...
  unit: string
  route: string // Đường dùng: ... Ấn Độ, Ý, Pháp, ...
  source: string // Nguồn gốc: ... Ấn Độ, Ý, Pháp, ...
  image: string
  hintUsage: string // Gợi ý cách sử dụng
  isActive: 1 | 0 // Trạng thái
  updatedAt: number
  deletedAt: number | null

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
    const settingStore = useSettingStore()

    const ins = Product.init()
    ins.batchList = []
    ins.hasManageBatches = Number(settingStore.SYSTEM_SETTING.hasManageBatches) as 0 | 1
    ins.hasManageQuantity = Number(settingStore.SYSTEM_SETTING.hasManageQuantity) as 0 | 1
    return ins
  }

  static from(source: Product) {
    const target = new Product()
    Object.assign(target, source)
    if (source.batchList) {
      target.batchList = source.batchList.map((i) => {
        const batch = new Batch()
        Object.assign(batch, i)
        return batch
      })
    }
    return target
  }

  static fromList(sourceList: Product[]): Product[] {
    return sourceList.map((i) => Product.from(i))
  }
}
