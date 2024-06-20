import {
  Expose,
  instanceToInstance,
  instanceToPlain,
  plainToInstance,
  Type,
} from 'class-transformer'
import { FROM_INSTANCE, FROM_PLAIN, USER_CREATE, USER_UPDATE } from '../_base/base-expose'
import { Distributor } from '../distributor'
import { DistributorPayment } from '../distributor-payment/distributor-payment.model'
import { DiscountType } from '../enum'
import { ReceiptItem } from '../receipt-item/receipt-item.model'

export enum ReceiptStatus {
  Refund = -1,
  Draft = 0,
  Prepayment = 1, // Chờ gửi hàng
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
  @Expose({ groups: [FROM_PLAIN, FROM_INSTANCE] })
  id: number

  @Expose({ groups: [FROM_PLAIN, USER_CREATE] })
  distributorId: number

  @Expose({ groups: [FROM_PLAIN] })
  status: ReceiptStatus

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
  totalMoney: number // tổng tiền = tiền sản phẩm + phụ phí - tiền giảm giá

  @Expose({ groups: [FROM_PLAIN] })
  paid: number

  @Expose({ groups: [FROM_PLAIN] })
  debt: number // tiền nợ

  @Expose()
  note: string

  @Expose()
  startedAt: number

  @Expose({ groups: [FROM_PLAIN] })
  shippedAt: number

  @Expose({ groups: [FROM_PLAIN] })
  deletedAt: number

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => ReceiptItem)
  receiptItems?: ReceiptItem[]

  @Expose({ groups: [FROM_PLAIN] })
  @Type(() => Distributor)
  distributor?: Distributor

  @Expose({ groups: [FROM_PLAIN] })
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
    ins.totalMoney = 0
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

  static toBasic(root: Receipt) {
    const ins = new Receipt()
    Object.assign(ins, root)
    delete ins.receiptItems
    delete ins.distributor
    delete ins.distributorPayments
    return ins
  }

  static toBasics(roots: Receipt[]) {
    return roots.map((i) => Receipt.toBasic(i))
  }

  static fromPlain(plain: Record<string, any>): Receipt {
    return plainToInstance(Receipt, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(plains: Record<string, any>[]): Receipt[] {
    return plainToInstance(Receipt, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromInstance(instance: Receipt): Receipt {
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_INSTANCE],
    })
  }

  static toPlain(
    instance: Receipt,
    type: typeof USER_CREATE | typeof USER_UPDATE
  ): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }
}
