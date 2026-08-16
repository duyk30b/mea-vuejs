import { OmitClass, PickClass } from '../../utils'
import type { ConditionDate, ConditionEnum } from '../_base/base-condition'
import type { MoneyDirection, PaymentActionType, PaymentPersonType } from './payment.type'

export class PaymentGetParams {
  page?: number
  limit?: number
  relation?: {
    customer?: boolean
    distributor?: boolean
    employee?: boolean
    cashier?: boolean
    wallet?: boolean
    paymentTicketList?: { ticket?: boolean }
    paymentPurchaseOrderList?: { purchaseOrder?: boolean }
  }

  filter?: {
    personType?: PaymentPersonType | ConditionEnum<PaymentPersonType>
    personId?: number
    walletId?: string
    paymentActionType?: PaymentActionType | ConditionEnum<PaymentActionType>
    moneyDirection?: MoneyDirection | ConditionEnum<MoneyDirection>
    createdAt?: ConditionDate
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    createdAt?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<PaymentGetParams>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class PaymentPaginationQuery extends PaymentGetParams { }
export class PaymentListQuery extends OmitClass(PaymentGetParams, ['page']) { }
export class PaymentDetailQuery extends PickClass(PaymentGetParams, ['relation']) { }

export class PaymentResponseParams {
  response?: {
    payment?: {
      paymentTicketList?: boolean
    }
  }

  static toQuery(instance: Partial<PaymentResponseParams>) {
    return {
      response: instance.response ? JSON.stringify(instance.response) : undefined,
    }
  }
}
