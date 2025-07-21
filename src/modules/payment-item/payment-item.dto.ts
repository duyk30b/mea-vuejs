import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionEnum } from '../_base/base-condition'
import type { PaymentPersonType } from '../payment/payment.model'
import type { PaymentVoucherItemType, PaymentVoucherType } from './payment-item.model'

export class PaymentItemGetQuery {
  page?: number
  limit?: number
  relation?: {
    customer?: boolean
    distributor?: boolean
    employee?: boolean
    cashier?: boolean
    payment?: boolean
    ticket?: boolean
    receipt?: boolean
    ticketProcedure?: boolean
    ticketLaboratoryGroup?: boolean
    ticketRadiology?: boolean
  }

  filter?: {
    paymentId?: number
    paymentPersonType?: PaymentPersonType | ConditionEnum<PaymentPersonType>
    personId?: number
    createdAt?: ConditionDate
    voucherType?: PaymentVoucherType | ConditionEnum<PaymentVoucherType>
    voucherId?: number
    voucherItemType?: PaymentVoucherItemType | ConditionEnum<PaymentVoucherItemType>
    voucherItemId?: number
    cashierId?: number
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    createdAt?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<PaymentItemGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class PaymentItemPaginationQuery extends PaymentItemGetQuery { }
export class PaymentItemListQuery extends OmitClass(PaymentItemGetQuery, ['page']) { }
export class PaymentItemDetailQuery extends PickClass(PaymentItemGetQuery, ['relation']) { }


