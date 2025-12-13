import { OmitClass, PickClass } from '../../utils'
import type { ConditionEnum } from '../_base/base-condition'
import type { WalletType } from './wallet.model'

export class WalletGetQuery {
  page?: number
  limit?: number
  relation?: object
  filter?: {
    walletType?: WalletType | ConditionEnum<WalletType>
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    code?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<WalletGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class WalletPaginationQuery extends WalletGetQuery { }
export class WalletListQuery extends OmitClass(WalletGetQuery, ['page']) { }
export class WalletDetailQuery extends PickClass(WalletGetQuery, ['relation']) { }
