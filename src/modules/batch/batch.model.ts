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

  static from(source: Batch) {
    const target = new Batch()
    Object.assign(target, source)
    if (Object.prototype.hasOwnProperty.call(source, 'product')) {
      if (!source.product) {
        target.product = source.product
      } else {
        const product = new Product()
        Object.assign(product, source.product)
        target.product = product
      }
    }
    return target
  }

  static fromList(sourceList: Batch[]): Batch[] {
    return sourceList.map((i) => Batch.from(i))
  }
}
