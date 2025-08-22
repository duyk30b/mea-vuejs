import { Customer } from '../customer'
import { Distributor } from '../distributor'
import { Product } from '../product'
import { PurchaseOrder } from '../purchase-order'
import { StockCheck } from '../stock-check'
import { Ticket } from '../ticket'
import { User } from '../user'

export enum MovementType {
  Unknown = 0,
  PurchaseOrder = 1,
  Ticket = 2,
  UserChange = 3,
  StockCheck = 4,
  Excel = 5,
}

export const MovementTypeText = {
  [MovementType.Unknown]: 'Tất cả',
  [MovementType.PurchaseOrder]: 'Phiếu nhập',
  [MovementType.Ticket]: 'Phiếu xuất',
  [MovementType.UserChange]: 'NV sửa',
  [MovementType.StockCheck]: 'Kiểm hàng',
  [MovementType.Excel]: 'Excel',
}

export class ProductMovement {
  id: number
  movementType: MovementType
  contactId: number
  voucherId: number // ticketId hoặc purchaseOrderId
  voucherProductId: number // ticketProductId hoặc purchaseOrderItemId
  warehouseId: number
  productId: number
  batchId: number
  isRefund: 0 | 1

  quantity: number // Số lượng +/-
  costAmount: number
  openQuantityProduct: number // Số lượng ban đầu
  closeQuantityProduct: number // Số lượng sau thay đổi
  openQuantityBatch: number // Số lượng ban đầu
  closeQuantityBatch: number // Số lượng sau thay đổi
  openCostAmountBatch: number
  closeCostAmountBatch: number

  expectedPrice: number
  actualPrice: number
  createdAt: number

  product?: Product
  purchaseOrder?: PurchaseOrder
  ticket?: Ticket
  stockCheck?: StockCheck
  distributor?: Distributor
  customer?: Customer
  user?: User

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

    if (Object.prototype.hasOwnProperty.call(source, 'purchaseOrder')) {
      target.purchaseOrder = source.purchaseOrder ? PurchaseOrder.basic(source.purchaseOrder) : source.purchaseOrder
    }
    if (Object.prototype.hasOwnProperty.call(source, 'ticket')) {
      target.ticket = source.ticket ? Ticket.basic(source.ticket) : source.ticket
    }
    if (Object.prototype.hasOwnProperty.call(source, 'stockCheck')) {
      target.stockCheck = source.stockCheck
        ? StockCheck.basic(source.stockCheck)
        : source.stockCheck
    }

    if (Object.prototype.hasOwnProperty.call(source, 'distributor')) {
      target.distributor = source.distributor
        ? Distributor.basic(source.distributor)
        : source.distributor
    }
    if (Object.prototype.hasOwnProperty.call(source, 'customer')) {
      target.customer = source.customer ? Customer.basic(source.customer) : source.customer
    }
    if (Object.prototype.hasOwnProperty.call(source, 'user')) {
      target.user = source.user ? User.basic(source.user) : source.user
    }
    return target
  }

  static fromList(sourceList: ProductMovement[]): ProductMovement[] {
    return sourceList.map((i) => ProductMovement.from(i))
  }
}
