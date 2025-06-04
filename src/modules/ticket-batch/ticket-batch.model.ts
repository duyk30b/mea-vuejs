import { Batch } from '../batch'
import type { Customer } from '../customer'
import { DeliveryStatus } from '../enum'
import { Product } from '../product'
import type { Ticket } from '../ticket/ticket.model'

export class TicketBatch {
  id: number
  customerId: number
  ticketId: number
  ticketProductId: number
  warehouseId: number
  productId: number
  batchId: number
  deliveryStatus: DeliveryStatus
  unitRate: number
  quantity: number
  costAmount: number
  expectedPrice: number
  actualPrice: number

  ticket?: Ticket
  customer?: Customer
  product?: Product | null
  batch?: Batch | null

  get unitName() {
    return this.product?.getUnitNameByRate(this.unitRate) || ''
  }

  get unitQuantity() {
    return Number((this.quantity / this.unitRate).toFixed(3))
  }

  get unitExpectedPrice() {
    return this.expectedPrice * this.unitRate
  }

  get unitActualPrice() {
    return this.actualPrice * this.unitRate
  }

  set unitQuantity(data: number) {
    this.quantity = data * this.unitRate
  }

  set unitExpectedPrice(data: number) {
    this.expectedPrice = data / this.unitRate
  }

  set unitActualPrice(data: number) {
    this.actualPrice = data / this.unitRate
  }

  static init(): TicketBatch {
    const ins = new TicketBatch()
    ins.id = 0
    ins.ticketId = 0
    ins.customerId = 0
    ins.productId = 0
    ins.batchId = 0
    ins.deliveryStatus = DeliveryStatus.Pending
    ins.unitRate = 1
    ins.quantity = 0
    ins.actualPrice = 0
    return ins
  }

  static blank(): TicketBatch {
    const ins = TicketBatch.init()
    ins.product = Product.init()
    ins.batch = Batch.init()
    return ins
  }

  static basic(source: TicketBatch) {
    const target = new TicketBatch()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: TicketBatch[]): TicketBatch[] {
    return sources.map((i) => TicketBatch.basic(i))
  }

  static from(source: TicketBatch) {
    const target = TicketBatch.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'product')) {
      target.product = source.product ? Product.basic(source.product) : source.product
    }
    if (Object.prototype.hasOwnProperty.call(source, 'batch')) {
      target.batch = source.batch ? Batch.basic(source.batch) : source.batch
    }
    return target
  }

  static fromList(sourceList: TicketBatch[]): TicketBatch[] {
    return sourceList.map((i) => TicketBatch.from(i))
  }

  static equal(a: TicketBatch, b: TicketBatch) {
    if (a.id != b.id) return false
    if (a.ticketId != b.ticketId) return false
    if (a.customerId != b.customerId) return false
    if (a.warehouseId != b.warehouseId) return false
    if (a.ticketProductId != b.ticketProductId) return false
    if (a.productId != b.productId) return false
    if (a.batchId != b.batchId) return false
    if (a.deliveryStatus != b.deliveryStatus) return false
    if (a.quantity != b.quantity) return false
    if (a.costAmount != b.costAmount) return false
    if (a.expectedPrice != b.expectedPrice) return false
    if (a.actualPrice != b.actualPrice) return false
    return true
  }

  static equalList(a: TicketBatch[], b: TicketBatch[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!TicketBatch.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
