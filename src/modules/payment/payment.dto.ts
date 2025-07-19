import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionEnum } from '../_base/base-condition'
import type { MoneyDirection, PaymentTiming, PersonType, VoucherType } from './payment.model'

export class PaymentGetQuery {
  page?: number
  limit?: number
  relation?: {
    customer?: boolean
    distributor?: boolean
    ticket?: boolean
    receipt?: boolean
    cashier?: boolean
    paymentMethod?: boolean
  }

  filter?: {
    paymentMethodId?: number
    voucherType?: VoucherType | ConditionEnum<VoucherType>
    voucherId?: number
    personType?: PersonType | ConditionEnum<PersonType>
    personId?: number
    paymentTiming?: PaymentTiming | ConditionEnum<PaymentTiming>
    createdAt?: ConditionDate
    moneyDirection?: MoneyDirection | ConditionEnum<MoneyDirection>
    cashierId?: number
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    createdAt?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<PaymentGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class PaymentPaginationQuery extends PaymentGetQuery { }
export class PaymentListQuery extends OmitClass(PaymentGetQuery, ['page']) { }
export class PaymentDetailQuery extends PickClass(PaymentGetQuery, ['relation']) { }

export interface DistributorPaymentBody {
  distributorId: number
  cashierId: number
  paymentMethodId: number
  money: number
  note: string
  receiptPaymentList: { receiptId: number; money: number }[]
}
