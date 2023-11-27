import { Expose, instanceToInstance, instanceToPlain, plainToInstance, Transform, Type } from 'class-transformer'
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

export class Receipt extends BaseModel {
  @Expose({ groups: ['ALL', 'CREATE'] })
  distributorId: number

  @Expose({ toClassOnly: true })
  status: ReceiptStatus

  @Expose()
  time: number

  @Expose({ toClassOnly: true })
  deleteTime: number

  @Expose()
  itemsActualMoney: number = 0 // tiền sản phẩm

  @Expose()
  @Transform(({ value }) => value || 0)
  discountMoney: number = 0 // tiền giảm giá

  @Expose()
  @Transform(({ value }) => value || 0)
  discountPercent: number = 0 // % giảm giá

  @Expose()
  discountType: DiscountType = DiscountType.Percent // Loại giảm giá

  @Expose()
  @Transform(({ value }) => value || 0)
  surcharge: number = 0 // phụ phí: tiền phải trả thêm: như tiền ship, tiền vé, hao phí xăng dầu

  @Expose()
  revenue: number = 0 // tổng tiền = tiền sản phẩm + phụ phí - tiền giảm giá

  @Expose({ toClassOnly: true })
  @Transform(({ value }) => value || 0)
  paid: number = 0

  @Expose({ toClassOnly: true })
  @Transform(({ value }) => value || 0)
  debt: number = 0 // tiền nợ

  @Expose()
  note: string

  @Expose()
  @Type(() => ReceiptItem)
  receiptItems: ReceiptItem[] = []

  @Expose({ toClassOnly: true })
  @Type(() => Distributor)
  distributor: Distributor

  @Expose({ toClassOnly: true })
  @Type(() => DistributorPayment)
  distributorPayments: DistributorPayment[] = []

  static blank(): Receipt {
    return new Receipt()
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
      ignoreDecorators: true,
      groups: ['ALL'],
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
