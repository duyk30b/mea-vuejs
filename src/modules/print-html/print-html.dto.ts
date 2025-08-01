import { OmitClass, PickClass } from '../../utils'
import type { ConditionNumber } from '../_base/base-condition'
import type { PrintHtmlType } from './print-html.model'

export class PrintHtmlGetQuery {
  page?: number
  limit?: number
  relation?: object
  filter?: {
    oid?: number | ConditionNumber
    id?: number | ConditionNumber
    printHtmlType?: PrintHtmlType
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    priority?: 'ASC' | 'DESC'
    printHtmlType?: 'ASC' | 'DESC'
    name?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<PrintHtmlGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class PrintHtmlPaginationQuery extends PrintHtmlGetQuery { }
export class PrintHtmlGetListQuery extends OmitClass(PrintHtmlGetQuery, ['page']) { }
export class PrintHtmlGetOneQuery extends OmitClass(PrintHtmlGetQuery, ['page', 'limit']) { }
export class PrintHtmlDetailQuery extends PickClass(PrintHtmlGetQuery, ['relation']) { }
