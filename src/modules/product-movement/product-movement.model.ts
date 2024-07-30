import { Customer } from '../customer'
import { Distributor } from '../distributor'
import type { VoucherType } from '../enum'
import { Product } from '../product'
import { Receipt } from '../receipt'
import { Ticket } from '../ticket'

export class ProductMovement {
  id: number
  productId: number
  voucherId: number
  contactId: number
  voucherType: VoucherType
  isRefund: 0 | 1
  openQuantity: number // Số lượng ban đầu
  quantity: number // Số lượng +/-
  closeQuantity: number // Số lượng sau thay đổi
  unitRate: number
  actualPrice: number // Giá
  expectedPrice: number // Giá
  openCostAmount: number // Vốn
  costAmount: number // Vốn
  closeCostAmount: number // Vốn
  createdAt: number

  product?: Product
  receipt?: Receipt
  distributor?: Distributor
  ticket?: Ticket
  customer?: Customer

  get unitQuantity() {
    return this.quantity / this.unitRate
  }

  get unitActualPrice() {
    return this.actualPrice * this.unitRate
  }

  get unitExpectedPrice() {
    return this.expectedPrice * this.unitRate
  }

  get unitName() {
    return this.product!.getUnitNameByRate(this.unitRate) || ''
  }

  static basic(source: ProductMovement) {
    const target = new ProductMovement()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: ProductMovement[]): ProductMovement[] {
    return sources.map((i) => ProductMovement.basic(i))
  }

  static from(source: ProductMovement) {
    const target = ProductMovement.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'product')) {
      target.product = source.product ? Product.basic(source.product) : source.product
    }
    if (Object.prototype.hasOwnProperty.call(source, 'receipt')) {
      target.receipt = source.receipt ? Receipt.basic(source.receipt) : source.receipt
    }
    if (Object.prototype.hasOwnProperty.call(source, 'distributor')) {
      target.distributor = source.distributor
        ? Distributor.basic(source.distributor)
        : source.distributor
    }
    if (Object.prototype.hasOwnProperty.call(source, 'ticket')) {
      target.ticket = source.ticket ? Ticket.basic(source.ticket) : source.ticket
    }
    if (Object.prototype.hasOwnProperty.call(source, 'customer')) {
      target.customer = source.customer ? Customer.basic(source.customer) : source.customer
    }
    return target
  }

  static fromList(sourceList: ProductMovement[]): ProductMovement[] {
    return sourceList.map((i) => ProductMovement.from(i))
  }
}
