import { Expose, instanceToInstance, instanceToPlain, plainToInstance, Transform, Type } from 'class-transformer'
import { BaseModel } from '../base.model'
import { Customer, CustomerPayment } from '../customer'
import { DiscountType } from '../enum'
import { InvoiceExpense } from './invoice-expense.model'
import { InvoiceItem } from './invoice-item.model'
import { InvoiceSurcharge } from './invoice-surcharge.model'

export enum InvoiceStatus {
  Refund = -1,
  Draft = 0,
  AwaitingShipment = 1,
  Debt = 2,
  Success = 3,
}

export class Invoice extends BaseModel {
  @Expose({ toClassOnly: true })
  arrivalId: number

  @Expose({ groups: ['ALL', 'CREATE'] })
  customerId: number

  @Expose({ toClassOnly: true })
  status: InvoiceStatus

  @Expose()
  time: number

  @Expose({ toClassOnly: true })
  deleteTime: number

  @Expose()
  itemsCostMoney: number = 0 // tổng tiền cost = tổng cost sản phẩm

  @Expose()
  itemsActualMoney: number = 0 // totalItemProduct + totalItemProcedure

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
  surcharge: number = 0 // phụ phí

  @Expose()
  revenue: number // Doanh thu = totalItemMoney + phụ phí - tiền giảm giá

  @Expose()
  @Transform(({ value }) => value || 0) // Mục này sinh ra để tính lãi cho chính xác, nghĩa là để trừ cả các chi phí sinh ra khi tạo đơn
  expense: number = 0 // Mục này sẽ không hiện trong đơn hàng, khách hàng ko nhìn thấy

  @Expose()
  @Transform(({ value }) => value || 0)
  profit: number // tiền lãi = Doanh thu - tiền cost - khoản chi

  @Expose({ toClassOnly: true })
  @Transform(({ value }) => value || 0)
  paid: number = 0 // tiền đã thanh toán

  @Expose({ toClassOnly: true })
  @Transform(({ value }) => value || 0)
  debt: number = 0 // tiền nợ

  @Expose()
  note: string = '' // Ghi chú

  // @Expose({ name: 'arrival' })
  // @Type(() => Arrival)
  // arrival: Arrival

  @Expose()
  @Type(() => InvoiceItem)
  invoiceItems: InvoiceItem[] = []

  @Expose()
  @Type(() => InvoiceSurcharge)
  invoiceSurcharges: InvoiceSurcharge[] = [InvoiceSurcharge.blank()] // Phụ phí chi tiết

  @Expose()
  @Type(() => InvoiceExpense)
  invoiceExpenses: InvoiceExpense[] = [InvoiceExpense.blank()] // Chi phí chi tiết

  @Expose({ toClassOnly: true })
  @Type(() => Customer)
  customer?: Customer

  @Expose({ toClassOnly: true })
  @Type(() => CustomerPayment)
  customerPayments: CustomerPayment[] = []

  static blank(): Invoice {
    return new Invoice()
  }

  static fromPlain(dto: Record<string, any>): Invoice {
    return plainToInstance(Invoice, dto, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromPlains(dto: Record<string, any>[]): Invoice[] {
    return plainToInstance(Invoice, dto, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromInstance(instance: Invoice): Invoice {
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      ignoreDecorators: true,
      groups: ['ALL'],
    })
  }

  static toPlain(instance: Invoice, type: 'CREATE' | 'UPDATE'): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }
}
