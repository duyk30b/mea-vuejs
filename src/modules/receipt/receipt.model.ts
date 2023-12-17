import {
  Expose,
  instanceToInstance,
  instanceToPlain,
  plainToInstance,
  Transform,
  Type,
} from 'class-transformer'
import { BaseModel } from '../base.model'
import { Distributor, DistributorPayment } from '../distributor'
import { DiscountType } from '../enum'
import { ReceiptItem } from './receipt-item.model'

export enum ReceiptStatus {
  Refund = -1,
  Draft = 0,
  AwaitingShipment = 1, // Chờ gửi hàng
  Debt = 2,
  Success = 3,
}

// Sử dụng Group Transform trong 1 số trường hợp nhất định
//                 GROUP          distributorId        debt         status
// Fetch Data       ALL               ✓                 ✓
// Insert          CREATE             ✓
// Update          UPDATE
// COPY             COPY              ✓                 ✓
// Blank            BLANK          chỉ dùng giá trị mặc định cho trường hợp này

export class Receipt {
  @Expose({ groups: ['ALL', 'COPY'] })
  id: number

  @Expose({ groups: ['ALL', 'CREATE'] })
  distributorId: number

  @Expose({ groups: ['ALL'] })
  status: ReceiptStatus

  @Expose()
  time: number

  @Expose({ groups: ['ALL'] })
  deleteTime: number

  @Expose()
  itemsActualMoney: number // tiền sản phẩm

  @Expose()
  discountMoney: number // tiền giảm giá

  @Expose()
  discountPercent: number // % giảm giá

  @Expose()
  discountType: DiscountType // Loại giảm giá

  @Expose()
  surcharge: number // phụ phí: tiền phải trả thêm: như tiền ship, tiền vé, hao phí xăng dầu

  @Expose()
  revenue: number // tổng tiền = tiền sản phẩm + phụ phí - tiền giảm giá

  @Expose({ groups: ['ALL'] })
  @Transform(({ value }) => value || 0)
  paid: number

  @Expose({ groups: ['ALL'] })
  @Transform(({ value }) => value || 0)
  debt: number // tiền nợ

  @Expose()
  note: string

  @Expose({ groups: ['ALL', 'CREATE', 'UPDATE'] })
  @Type(() => ReceiptItem)
  receiptItems?: ReceiptItem[]

  @Expose({ groups: ['ALL'] })
  @Type(() => Distributor)
  distributor?: Distributor

  @Expose({ groups: ['ALL'] })
  @Type(() => DistributorPayment)
  distributorPayments?: DistributorPayment[]

  static init(): Receipt {
    const ins = new Receipt()
    ins.id = 0
    ins.status = ReceiptStatus.Draft
    ins.itemsActualMoney = 0
    ins.discountMoney = 0
    ins.discountPercent = 0
    ins.discountType = DiscountType.Percent
    ins.surcharge = 0
    ins.revenue = 0
    ins.paid = 0
    ins.debt = 0

    return ins
  }

  static blank(): Receipt {
    const ins = Receipt.init()
    ins.receiptItems = []
    ins.distributor = Distributor.init()
    ins.distributorPayments = []
    return ins
  }

  static fromPlain(plain: Record<string, any>): Receipt {
    return plainToInstance(Receipt, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromPlains(plains: Record<string, any>[]): Receipt[] {
    return plainToInstance(Receipt, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromInstance(instance: Receipt): Receipt {
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['COPY'],
    })
  }

  static toPlain(instance: Receipt, type: 'CREATE' | 'UPDATE'): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }
}
