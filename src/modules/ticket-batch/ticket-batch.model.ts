import { Batch } from '../batch'
import type { Customer } from '../customer'
import { DeliveryStatus } from '../enum'
import { Product } from '../product'
import type { Ticket } from '../ticket/ticket.model'

export class TicketBatch {
  id: string
  customerId: number
  ticketId: string
  ticketProductId: string
  warehouseId: number
  productId: number
  batchId: number
  deliveryStatus: DeliveryStatus
  unitRate: number
  unitQuantity: number
  costAmount: number
  unitExpectedPrice: number
  unitActualPrice: number

  ticket?: Ticket
  customer?: Customer
  product?: Product | null
  batch?: Batch | null

  get unitName() {
    return this.product?.getUnitNameByRate(this.unitRate) || ''
  }

  static init(): TicketBatch {
    const ins = new TicketBatch()
    ins.id = ''
    ins.ticketId = ''
    ins.customerId = 0
    ins.productId = 0
    ins.batchId = 0
    ins.deliveryStatus = DeliveryStatus.Pending
    ins.unitRate = 1
    ins.unitQuantity = 0
    ins.unitExpectedPrice = 0
    ins.unitActualPrice = 0
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
    if (a.unitQuantity != b.unitQuantity) return false
    if (a.costAmount != b.costAmount) return false
    if (a.unitExpectedPrice != b.unitExpectedPrice) return false
    if (a.unitActualPrice != b.unitActualPrice) return false
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
