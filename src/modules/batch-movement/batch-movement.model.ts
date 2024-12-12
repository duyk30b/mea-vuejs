import { Batch } from '../batch/batch.model'
import { Customer } from '../customer'
import { Distributor } from '../distributor'
import type { MovementType } from '../enum'
import { Product } from '../product'
import { Receipt } from '../receipt'
import { Ticket } from '../ticket'
import { User } from '../user'

export class BatchMovement {
  id: number
  warehouseId: number
  productId: number
  batchId: number
  movementType: MovementType
  voucherId: number
  contactId: number
  isRefund: boolean
  unitRate: number
  openQuantity: number // Số lượng ban đầu
  quantity: number // Số lượng +/-
  closeQuantity: number // Số lượng sau thay đổi
  actualPrice: number // Giá
  expectedPrice: number // Giá
  createdAt: number

  batch?: Batch
  product?: Product
  receipt?: Receipt
  distributor?: Distributor
  ticket?: Ticket
  customer?: Customer
  user?: User

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

  static basic(source: BatchMovement) {
    const target = new BatchMovement()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: BatchMovement[]): BatchMovement[] {
    return sources.map((i) => BatchMovement.basic(i))
  }

  static from(source: BatchMovement) {
    const target = BatchMovement.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'product')) {
      target.product = source.product ? Product.basic(source.product) : source.product
    }
    if (Object.prototype.hasOwnProperty.call(source, 'batch')) {
      target.batch = source.batch ? Batch.basic(source.batch) : source.batch
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

    if (Object.prototype.hasOwnProperty.call(source, 'user')) {
      target.user = source.user ? User.basic(source.user) : source.user
    }
    return target
  }

  static fromList(sourceList: BatchMovement[]): BatchMovement[] {
    return sourceList.map((i) => BatchMovement.from(i))
  }
}
