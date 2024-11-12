import { OmitClass, PickClass } from '../../utils'
import type { PrintHtmlType } from './print-html.model'

export class PrintHtmlGetQuery {
  page?: number
  limit?: number
  relation?: { paraclinical?: boolean }
  filter?: {
    type?: keyof typeof PrintHtmlType
    paraclinicalId?: number
  }

  sort?: {
    id?: 'ASC' | 'DESC'
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

export class PrintHtmlPaginationQuery extends PrintHtmlGetQuery {}
export class PrintHtmlGetListQuery extends OmitClass(PrintHtmlGetQuery, ['page']) {}
export class PrintHtmlGetOneQuery extends OmitClass(PrintHtmlGetQuery, ['page', 'limit']) {}
export class PrintHtmlDetailQuery extends PickClass(PrintHtmlGetQuery, ['relation']) {}
