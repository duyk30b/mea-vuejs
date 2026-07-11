import { OmitClass, PickClass } from '../../utils'
import type { ConditionNumber } from '../_base/base-condition'
import type { TemplateHtmlType } from './template-html.model'

export class TemplateHtmlGetQuery {
  page?: number
  limit?: number
  relation?: object
  filter?: {
    oid?: number | ConditionNumber
    id?: number | ConditionNumber
    templateHtmlType?: TemplateHtmlType
  }

  sort?: {
    id?: 'ASC' | 'DESC'
    priority?: 'ASC' | 'DESC'
    templateHtmlType?: 'ASC' | 'DESC'
    name?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<TemplateHtmlGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class TemplateHtmlPaginationQuery extends TemplateHtmlGetQuery { }
export class TemplateHtmlGetListQuery extends OmitClass(TemplateHtmlGetQuery, ['page']) { }
export class TemplateHtmlGetOneQuery extends OmitClass(TemplateHtmlGetQuery, ['page', 'limit']) { }
export class TemplateHtmlDetailQuery extends PickClass(TemplateHtmlGetQuery, ['relation']) { }
