import { Expose } from 'class-transformer'
import { BaseModel } from '../base.model'
import { UNKNOWN_KEY } from '../enum'

export class InvoiceSurcharge extends BaseModel {
  @Expose({ toClassOnly: true })
  invoiceId: number

  @Expose()
  key: string = UNKNOWN_KEY

  @Expose()
  name: string = ''

  @Expose()
  money: number = 0

  static blank(): InvoiceSurcharge {
    return new InvoiceSurcharge()
  }
}
