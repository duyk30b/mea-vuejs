import { CollectionQuery } from '@/core/indexed-db/common/collection.query'
import { ref } from 'vue'
import { ESArray } from '../../utils'
import { TemplateHtmlApi } from './template-html.api'
import type {
    TemplateHtmlGetListQuery,
    TemplateHtmlGetOneQuery,
    TemplateHtmlGetQuery,
    TemplateHtmlPaginationQuery,
} from './template-html.dto'
import { TemplateHtml } from './template-html.model'

const TemplateHtmlDBQuery = new CollectionQuery<TemplateHtml>()

export class TemplateHtmlService {
  static loadedAll: boolean = false
  static templateHtmlAll: TemplateHtml[] = []
  static templateHtmlMap = ref<Record<string, TemplateHtml>>({})

  static fetchAll = (() => {
    const start = async () => {
      try {
        const { templateHtmlList } = await TemplateHtmlApi.getList({ sort: { id: 'DESC' } })
        TemplateHtmlService.templateHtmlAll = templateHtmlList
        TemplateHtmlService.templateHtmlMap.value = ESArray.arrayToKeyValue(templateHtmlList, 'id')
      } catch (error: any) {
        console.log('🚀 ~ template-html.service.ts:27 ~ TemplateHtmlService ~ start ~ error:', error)
      }
    }
    let fetching: any = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetching || !TemplateHtmlService.loadedAll || options.refetch) {
        TemplateHtmlService.loadedAll = true
        fetching = start()
      }
      await fetching
    }
  })()

  private static executeQuery(all: TemplateHtml[], query: TemplateHtmlGetQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        return TemplateHtmlDBQuery.executeFilter(i, filter as any)
      })
    }
    if (query.sort) {
      data = TemplateHtmlDBQuery.executeSort(data, query.sort)
    }
    return data
  }

  static async executeRelation(
    templateHtmlList: TemplateHtml[],
    relation: TemplateHtmlGetQuery['relation'],
  ) {
    try {
      const templateHtmlIdList = templateHtmlList.map((i) => i.id)
    } catch (error) {
      console.log('🚀 ~ template-html.service.ts:78 ~ TemplateHtmlService ~ error:', error)
    }
  }

  static async getMap(options?: { refetch: boolean }) {
    await TemplateHtmlService.fetchAll({ refetch: !!options?.refetch })
    return TemplateHtmlService.templateHtmlMap.value
  }

  static async getAll(options?: { refetch?: boolean }) {
    await TemplateHtmlService.fetchAll({ refetch: !!options?.refetch })
    return TemplateHtmlService.templateHtmlAll
  }

  static async pagination(query: TemplateHtmlPaginationQuery, options?: { refetch: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await TemplateHtmlService.fetchAll({ refetch: !!options?.refetch })

    const dataQuery = TemplateHtmlService.executeQuery(TemplateHtmlService.templateHtmlAll, query)
    const data = dataQuery.slice((page - 1) * limit, page * limit)

    if (query.relation) {
      await TemplateHtmlService.executeRelation(data, query.relation)
    }

    return {
      templateHtmlList: TemplateHtml.fromList(data),
      total: dataQuery.length,
    }
  }

  static async list(query: TemplateHtmlGetListQuery, options?: { refetch: boolean }) {
    await TemplateHtmlService.fetchAll({ refetch: !!options?.refetch })
    const data = TemplateHtmlService.executeQuery(TemplateHtmlService.templateHtmlAll, query)

    return TemplateHtml.fromList(data)
  }

  static async getOne(query: TemplateHtmlGetOneQuery, options?: { refetch: boolean }) {
    await TemplateHtmlService.fetchAll({ refetch: !!options?.refetch })

    const data = TemplateHtmlService.executeQuery(TemplateHtmlService.templateHtmlAll, query)
    if (data.length > 0) {
      return TemplateHtml.from(data[0])
    }
    return null
  }

  static async detail(id: number) {
    await TemplateHtmlService.fetchAll()
    return TemplateHtmlService.templateHtmlAll.find((i) => {
      return i.id === id
    })
  }

  static async createOne(templateHtml: TemplateHtml) {
    const result = await TemplateHtmlApi.createOne(templateHtml)
    TemplateHtmlService.loadedAll = false
    return result
  }

  static async updateOne(id: number, templateHtml: TemplateHtml) {
    const result = await TemplateHtmlApi.updateOne(id, templateHtml)
    TemplateHtmlService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await TemplateHtmlApi.destroyOne(id)
    TemplateHtmlService.loadedAll = false
    return result
  }
}
