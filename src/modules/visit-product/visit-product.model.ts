import type { DiscountType } from '../enum'
import { Product } from '../product'
import type { VisitBatch } from '../visit-batch'

export class VisitProduct {
  id: number
  visitId: number
  productId: number
  isSent: number
  unitRate: number
  quantityPrescription: number
  quantity: number
  costAmount: number // Tổng giá cost
  expectedPrice: number // Giá dự kiến
  discountMoney: number // tiền giảm giá
  discountPercent: number // % giảm giá
  discountType: DiscountType // Loại giảm giá
  actualPrice: number // Giá thực tế
  hintUsage: string | null // Hướng dẫn sử dụng

  product?: Product | null
  visitBatchList?: VisitBatch[]

  get unitName() {
    return this.product?.getUnitNameByRate(this.unitRate) || ''
  }

  get unitQuantity() {
    return Number((this.quantity / this.unitRate).toFixed(3))
  }

  get unitQuantityPrescription() {
    return Number((this.quantityPrescription / this.unitRate).toFixed(3))
  }

  get unitExpectedPrice() {
    return this.expectedPrice * this.unitRate
  }

  get unitDiscountMoney() {
    return this.discountMoney * this.unitRate
  }

  get unitActualPrice() {
    return this.actualPrice * this.unitRate
  }

  set unitQuantity(data: number) {
    this.quantity = data * this.unitRate
  }

  set unitQuantityPrescription(data: number) {
    this.quantityPrescription = data * this.unitRate
  }

  set unitExpectedPrice(data: number) {
    this.expectedPrice = data / this.unitRate
  }

  set unitDiscountMoney(data: number) {
    this.discountMoney = data / this.unitRate
  }

  set unitActualPrice(data: number) {
    this.actualPrice = data / this.unitRate
  }

  static init(): VisitProduct {
    const ins = new VisitProduct()
    ins.id = 0
    ins.quantity = 0
    ins.quantityPrescription = 0
    ins.unitRate = 1
    ins.expectedPrice = 0
    ins.actualPrice = 0
    ins.hintUsage = ''
    return ins
  }

  static blank(): VisitProduct {
    const ins = VisitProduct.init()
    ins.product = Product.init()
    ins.visitBatchList = []
    return ins
  }

  static from(source: VisitProduct) {
    const target = new VisitProduct()
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

  static fromList(sourceList: VisitProduct[]): VisitProduct[] {
    return sourceList.map((i) => VisitProduct.from(i))
  }
}
