import { Expose, instanceToPlain, plainToInstance } from 'class-transformer'
import { FROM_PLAIN } from '../_base/base-expose'
import { BaseModel } from '../base.model'
import type { PaymentType } from '../enum'

export class CustomerPayment {
  @Expose({ name: 'id', toClassOnly: true })
  id: number

  @Expose()
  customerId: number

  @Expose()
  invoiceId: number

  @Expose()
  createdAt: number

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
    const instance = new CustomerPayment()
    instance.id = 0
    return instance
  }

  static fromPlain(plain: Record<string, any>): CustomerPayment {
    return plainToInstance(CustomerPayment, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static fromPlains(plains: Record<string, any>[]): CustomerPayment[] {
    return plainToInstance(CustomerPayment, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static toPlain(instance: Partial<CustomerPayment>): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }
}
