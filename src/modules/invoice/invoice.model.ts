import {
  Expose,
  instanceToInstance,
  instanceToPlain,
  plainToInstance,
  Transform,
  Type,
} from 'class-transformer'
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

  @Expose({ groups: ['ALL'] })
  @Transform(({ value }) => (value != null ? value : InvoiceStatus.Draft))
  status: InvoiceStatus

  @Expose()
  time: number

  @Expose({ groups: ['ALL'] })
  deleteTime: number

  @Expose()
  itemsCostMoney: number // tổng tiền cost = tổng cost sản phẩm

  @Expose()
  itemsActualMoney: number // totalItemProduct + totalItemProcedure

  @Expose()
  @Transform(({ value }) => value || 0)
  discountMoney: number // tiền giảm giá

  @Expose()
  @Transform(({ value }) => value || 0)
  discountPercent: number // % giảm giá

  @Expose()
  @Transform(({ value }) => (value != null ? value : DiscountType.Percent))
  discountType: DiscountType // Loại giảm giá

  @Expose()
  @Transform(({ value }) => value || 0)
  surcharge: number // phụ phí

  @Expose()
  revenue: number // Doanh thu = totalItemMoney + phụ phí - tiền giảm giá

  @Expose()
  @Transform(({ value }) => value || 0) // Mục này sinh ra để tính lãi cho chính xác, nghĩa là để trừ cả các chi phí sinh ra khi tạo đơn
  expense: number // Mục này sẽ không hiện trong đơn hàng, khách hàng ko nhìn thấy

  @Expose()
  @Transform(({ value }) => value || 0)
  profit: number // tiền lãi = Doanh thu - tiền cost - khoản chi

  @Expose({ groups: ['ALL'] })
  @Transform(({ value }) => value || 0)
  paid: number // tiền đã thanh toán

  @Expose({ groups: ['ALL'] })
  @Transform(({ value }) => value || 0)
  debt: number // tiền nợ

  @Expose()
  note: string // Ghi chú

  // @Expose({ name: 'arrival' })
  // @Type(() => Arrival)
  // arrival: Arrival

  @Expose({ groups: ['ALL', 'CREATE', 'UPDATE'] })
  @Type(() => InvoiceItem)
  invoiceItems?: InvoiceItem[]

  @Expose({ groups: ['ALL', 'CREATE', 'UPDATE'] })
  @Type(() => InvoiceSurcharge)
  invoiceSurcharges?: InvoiceSurcharge[] // Phụ phí chi tiết

  @Expose({ groups: ['ALL', 'CREATE', 'UPDATE'] })
  @Type(() => InvoiceExpense)
  invoiceExpenses?: InvoiceExpense[] // Chi phí chi tiết

  @Expose({ groups: ['ALL'] })
  @Type(() => Customer)
  customer?: Customer

  @Expose({ groups: ['ALL'] })
  @Type(() => CustomerPayment)
  customerPayments: CustomerPayment[]

  static blank(): Invoice {
    const instance = Invoice.fromInstance(new Invoice())
    instance.invoiceItems = []
    instance.customerPayments = []
    instance.customer = Customer.fromInstance(new Customer())
    instance.invoiceExpenses = [new InvoiceExpense()]
    instance.invoiceSurcharges = [new InvoiceExpense()]
    return instance
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
      groups: ['COPY'],
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
