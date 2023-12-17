import { Expose } from 'class-transformer'
import { BaseModel } from '../base.model'
import { UNKNOWN_KEY } from '../enum'

export class InvoiceExpense extends BaseModel {
  @Expose({ toClassOnly: true })
  invoiceId: number

  @Expose()
  key: string = UNKNOWN_KEY

  @Expose()
  name: string = ''

  @Expose()
  money: number = 0

  static blank(): InvoiceExpense {
    const instance = new InvoiceExpense()
    instance.id = 0
    return instance
  }
}
