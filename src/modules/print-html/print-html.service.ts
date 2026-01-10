import { CollectionQuery } from '@/core/indexed-db/common/collection.query'
import { ref } from 'vue'
import { ESArray } from '../../utils'
import { PrintHtmlApi } from './print-html.api'
import type {
  PrintHtmlGetListQuery,
  PrintHtmlGetOneQuery,
  PrintHtmlGetQuery,
  PrintHtmlPaginationQuery,
} from './print-html.dto'
import { PrintHtml } from './print-html.model'

const PrintHtmlDBQuery = new CollectionQuery<PrintHtml>()

export class PrintHtmlService {
  static loadedAll: boolean = false
  static printHtmlAll: PrintHtml[] = []
  static printHtmlMap = ref<Record<string, PrintHtml>>({})

  static fetchAll = (() => {
    const start = async () => {
      try {
        const { printHtmlList } = await PrintHtmlApi.getList({ sort: { id: 'DESC' } })
        PrintHtmlService.printHtmlAll = printHtmlList
        PrintHtmlService.printHtmlMap.value = ESArray.arrayToKeyValue(printHtmlList, 'id')
      } catch (error: any) {
        console.log('🚀 ~ print-html.service.ts:27 ~ PrintHtmlService ~ start ~ error:', error)
      }
    }
    let fetching: any = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetching || !PrintHtmlService.loadedAll || options.refetch) {
        PrintHtmlService.loadedAll = true
        fetching = start()
      }
      await fetching
    }
  })()

  private static executeQuery(all: PrintHtml[], query: PrintHtmlGetQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        return PrintHtmlDBQuery.executeFilter(i, filter as any)
      })
    }
    if (query.sort) {
      data = PrintHtmlDBQuery.executeSort(data, query.sort)
    }
    return data
  }

  static async executeRelation(
    printHtmlList: PrintHtml[],
    relation: PrintHtmlGetQuery['relation'],
  ) {
    try {
      const printHtmlIdList = printHtmlList.map((i) => i.id)
    } catch (error) {
      console.log('🚀 ~ printHtml.service.ts:78 ~ PrintHtmlService ~ error:', error)
    }
  }

  static async getMap(options?: { refetch: boolean }) {
    await PrintHtmlService.fetchAll({ refetch: !!options?.refetch })
    return PrintHtmlService.printHtmlMap.value
  }

  static async getAll(options?: { refetch?: boolean }) {
    await PrintHtmlService.fetchAll({ refetch: !!options?.refetch })
    return PrintHtmlService.printHtmlAll
  }

  static async pagination(query: PrintHtmlPaginationQuery, options?: { refetch: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await PrintHtmlService.fetchAll({ refetch: !!options?.refetch })

    const dataQuery = PrintHtmlService.executeQuery(PrintHtmlService.printHtmlAll, query)
    const data = dataQuery.slice((page - 1) * limit, page * limit)

    if (query.relation) {
      await PrintHtmlService.executeRelation(data, query.relation)
    }

    return {
      printHtmlList: PrintHtml.fromList(data),
      total: dataQuery.length,
    }
  }

  static async list(query: PrintHtmlGetListQuery, options?: { refetch: boolean }) {
    await PrintHtmlService.fetchAll({ refetch: !!options?.refetch })
    const data = PrintHtmlService.executeQuery(PrintHtmlService.printHtmlAll, query)

    return PrintHtml.fromList(data)
  }

  static async getOne(query: PrintHtmlGetOneQuery, options?: { refetch: boolean }) {
    await PrintHtmlService.fetchAll({ refetch: !!options?.refetch })

    const data = PrintHtmlService.executeQuery(PrintHtmlService.printHtmlAll, query)
    if (data.length > 0) {
      return PrintHtml.from(data[0])
    }
    return null
  }

  static async detail(id: number) {
    await PrintHtmlService.fetchAll()
    return PrintHtmlService.printHtmlAll.find((i) => {
      return i.id === id
    })
  }

  static async createOne(printHtml: PrintHtml) {
    const result = await PrintHtmlApi.createOne(printHtml)
    PrintHtmlService.loadedAll = false
    return result
  }

  static async updateOne(id: number, printHtml: PrintHtml) {
    const result = await PrintHtmlApi.updateOne(id, printHtml)
    PrintHtmlService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await PrintHtmlApi.destroyOne(id)
    PrintHtmlService.loadedAll = false
    return result
  }
}
