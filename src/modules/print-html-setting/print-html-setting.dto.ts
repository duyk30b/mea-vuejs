import { OmitClass, PickClass } from '../../utils'
import type { ConditionNumber } from '../_base/base-condition'
import type { PrintHtmlType } from '../print-html/print-html.model'

export class PrintHtmlSettingGetQuery {
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
    printHtmlId?: 'ASC' | 'DESC'
    printHtmlType?: 'ASC' | 'DESC'
  }

  static toQuery(instance: Partial<PrintHtmlSettingGetQuery>) {
    return {
      page: instance?.page,
      limit: instance?.limit,
      relation: instance.relation ? JSON.stringify(instance.relation) : undefined,
      filter: instance.filter ? JSON.stringify(instance.filter) : undefined,
      sort: instance.sort ? JSON.stringify(instance.sort) : undefined,
    }
  }
}

export class PrintHtmlSettingPaginationQuery extends PrintHtmlSettingGetQuery { }
export class PrintHtmlSettingGetListQuery extends OmitClass(PrintHtmlSettingGetQuery, ['page']) { }
export class PrintHtmlSettingGetOneQuery extends OmitClass(PrintHtmlSettingGetQuery, [
  'page',
  'limit',
]) { }
export class PrintHtmlSettingDetailQuery extends PickClass(PrintHtmlSettingGetQuery, [
  'relation',
]) { }
