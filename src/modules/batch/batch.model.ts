import { Product } from '../product/product.model'

export class Batch {
  id: number
  distributorId: number
  warehouseId: number
  productId: number

  batchCode: string // Lô sản phẩm
  expiryDate?: number

  quantity: number

  costPrice: number // Giá nhập // Vẫn rất cần thiết giữ lại giá nhập này, vì khi thay đổi costAmount gây ra số lượng âm thì có costPrice để fix lại
  costAmount: number // Tổng vốn

  updatedAt: number
  registeredAt: number

  product?: Product

  get unitQuantity() {
    return Number(((this.quantity || 0) / this.product!.unitDefaultRate).toFixed(3))
  }

  get unitCostPrice() {
    return this.costPrice * this.product!.unitDefaultRate
  }

  set unitCostPrice(data) {
    this.costPrice = data / this.product!.unitDefaultRate
  }

  static init() {
    const ins = new Batch()
    ins.id = 0
    ins.productId = 0
    ins.warehouseId = 0
    ins.distributorId = 0

    ins.batchCode = ''
    ins.costPrice = 0
    ins.quantity = 0
    return ins
  }

  static blank() {
    const ins = Batch.init()
    ins.product = Product.init()
    return ins
  }

  static basic(source: Batch) {
    const target = new Batch()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Batch[]): Batch[] {
    return sources.map((i) => Batch.basic(i))
  }

  static from(source: Batch) {
    const target = Batch.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'product')) {
      target.product = source.product ? Product.basic(source.product) : source.product
    }
    return target
  }

  static fromList(sourceList: Batch[]): Batch[] {
    return sourceList.map((i) => Batch.from(i))
  }

  static equal(a: Batch, b: Batch) {
    if (a.id != b.id) return false
    if (a.warehouseId != b.warehouseId) return false
    if (a.productId != b.productId) return false
    if (a.distributorId != b.distributorId) return false

    if (a.batchCode != b.batchCode) return false
    if (a.expiryDate != b.expiryDate) return false

    if (a.costPrice != b.costPrice) return false
    if (a.quantity != b.quantity) return false
    return true
  }
}
