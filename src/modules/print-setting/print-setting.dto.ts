import { OmitClass, PickClass } from '../../utils'
import type { ConditionNumber } from '../_base/base-condition'
import type { TemplateHtmlType } from '../template-html'

export class PrintSettingGetQuery {
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
    templateHtmlId?: 'ASC' | 'DESC'
    templateHtmlType?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<PrintSettingGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class PrintSettingPaginationQuery extends PrintSettingGetQuery { }
export class PrintSettingGetListQuery extends OmitClass(PrintSettingGetQuery, ['page']) { }
export class PrintSettingGetOneQuery extends OmitClass(PrintSettingGetQuery, [
  'page',
  'limit',
]) { }
export class PrintSettingDetailQuery extends PickClass(PrintSettingGetQuery, [
  'relation',
]) { }
