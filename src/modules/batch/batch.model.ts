import { Product } from '../product/product.model'

export class Batch {
  id: number
  productId: number
  lotNumber: string // Lô sản phẩm
  expiryDate?: number
  costPrice: number // Giá nhập
  wholesalePrice: number
  retailPrice: number
  quantity: number
  updatedAt: number

  product?: Product

  get unitQuantity() {
    return Number(((this.quantity || 0) / this.product!.unitDefaultRate).toFixed(3))
  }

  get unitCostPrice() {
    return this.costPrice * this.product!.unitDefaultRate
  }

  get unitWholesalePrice() {
    return this.wholesalePrice * this.product!.unitDefaultRate
  }

  get unitRetailPrice() {
    return this.retailPrice * this.product!.unitDefaultRate
  }

  set unitCostPrice(data) {
    this.costPrice = data / this.product!.unitDefaultRate
  }

  set unitWholesalePrice(data: number) {
    this.wholesalePrice = data / this.product!.unitDefaultRate
  }

  set unitRetailPrice(data: number) {
    this.retailPrice = data / this.product!.unitDefaultRate
  }

  static init() {
    const ins = new Batch()
    ins.id = 0
    ins.lotNumber = ''
    ins.costPrice = 0
    ins.wholesalePrice = 0
    ins.retailPrice = 0
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
}
