import { Expose, instanceToPlain, plainToInstance } from 'class-transformer'
import { BaseModel } from '../base.model'
import type { PaymentType } from '../enum'

export class CustomerPayment extends BaseModel {
  @Expose()
  customerId: number

  @Expose()
  invoiceId: number

  @Expose()
  time: number

  @Expose()
  type: PaymentType

  @Expose()
  paid: number = 0 // Số tiền thanh toán

  @Expose()
  debit: number // Ghi nợ: tiền nợ thêm hoặc trả nợ

  @Expose()
  customerOpenDebt: number = 0 // Dư nợ đầu kỳ của khách hàng

  @Expose() // customerOpenDebt + debit = customerCloseDebt
  customerCloseDebt: number = 0 // Dư nợ cuối kỳ của khách hàng

  @Expose()
  invoiceOpenDebt: number = 0 // Dư nợ đầu kỳ của hóa đơn

  @Expose() // invoiceOpenDebt + debit = invoiceCloseDebt
  invoiceCloseDebt: number = 0 // Dư nợ cuối kỳ của hóa đơn

  @Expose()
  note: string = ''

  @Expose()
  description: string = ''

  static blank(): CustomerPayment {
    return new CustomerPayment()
  }

  static fromPlain(plain: Record<string, any>): CustomerPayment {
    return plainToInstance(CustomerPayment, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromPlains(plains: Record<string, any>[]): CustomerPayment[] {
    return plainToInstance(CustomerPayment, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static toPlain(instance: Partial<CustomerPayment>): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}
