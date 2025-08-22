import { OmitClass, PickClass } from '../../utils'

export class ExpenseGetQuery {
  page?: number
  limit?: number
  relation?: object
  filter?: object

  sort?: {
    id?: 'ASC' | 'DESC'
    priority?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<ExpenseGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class ExpensePaginationQuery extends ExpenseGetQuery {}
export class ExpenseListQuery extends OmitClass(ExpenseGetQuery, ['page']) {}
export class ExpenseDetailQuery extends PickClass(ExpenseGetQuery, ['relation']) {}
