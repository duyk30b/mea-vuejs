import { Batch } from '../batch'
import { Product } from '../product'
import { StockCheckItem } from '../stock-check-item'
import { User } from '../user'

export enum StockCheckStatus {
  Draft = 0, // create(), update(), delete() => Nháp
  Pending = 1, // submit() => Đang chờ duyệt
  Confirmed = 2, // approve() => Đã được duyệt
  Balanced = 4, // reconcile() => Đã cân bằng
  Cancelled = 5, // void() => Hủy
}

export const StockCheckStatusText = {
  [StockCheckStatus.Draft]: 'Nháp',
  [StockCheckStatus.Pending]: 'Đợi duyệt',
  [StockCheckStatus.Confirmed]: 'Đã dụyệt',
  [StockCheckStatus.Balanced]: 'Đã cân bằng',
  [StockCheckStatus.Cancelled]: 'Hủy',
}

export class StockCheck {
  id: number
  createdAt: number
  updatedAt: number
  createdByUserId: number
  updatedByUserId: number
  status: StockCheckStatus
  warehouseId: number
  note: string // Ghi chú

  stockCheckItemList: StockCheckItem[]
  createdByUser: User
  updatedByUser: User

  static init(): StockCheck {
    const ins = new StockCheck()
    ins.id = 0
    ins.status = StockCheckStatus.Draft

    return ins
  }

  static blank(): StockCheck {
    const ins = StockCheck.init()
    ins.stockCheckItemList = []
    ins.updatedByUser = User.init()
    return ins
  }

  static basic(source: StockCheck) {
    const target = new StockCheck()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: StockCheck[]): StockCheck[] {
    return sources.map((i) => StockCheck.basic(i))
  }

  static from(source: StockCheck): StockCheck {
    const target = StockCheck.basic(source)
    Object.assign(target, source)
    if (Object.prototype.hasOwnProperty.call(source, 'updatedByUser')) {
      if (!source.updatedByUser) {
        target.updatedByUser = source.updatedByUser
      } else {
        const updatedByUser = new User()
        Object.assign(updatedByUser, source.updatedByUser)
        target.updatedByUser = updatedByUser
      }
    }
    if (Object.prototype.hasOwnProperty.call(source, 'createdByUser')) {
      if (!source.createdByUser) {
        target.createdByUser = source.createdByUser
      } else {
        const createdByUser = new User()
        Object.assign(createdByUser, source.createdByUser)
        target.createdByUser = createdByUser
      }
    }
    if (source.stockCheckItemList) {
      target.stockCheckItemList = source.stockCheckItemList.map((i) => {
        const stockCheckItem = new StockCheckItem()
        Object.assign(stockCheckItem, i)
        if (Object.prototype.hasOwnProperty.call(source, 'batch')) {
          if (!i.batch) {
            stockCheckItem.batch = i.batch
          } else {
            const batch = new Batch()
            Object.assign(batch, i.batch)
            stockCheckItem.batch = batch
          }
        }
        if (Object.prototype.hasOwnProperty.call(i, 'product')) {
          if (!i.product) {
            stockCheckItem.product = i.product
          } else {
            const product = new Product()
            Object.assign(product, i.product)
            stockCheckItem.product = product
          }
        }
        return stockCheckItem
      })
    }
    return target
  }

  static fromList(sourceList: StockCheck[]): StockCheck[] {
    return sourceList.map((i) => StockCheck.from(i))
  }
}
