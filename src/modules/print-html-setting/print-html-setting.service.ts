import { CollectionQuery } from '@/core/indexed-db/common/collection.query'
import type { PrintHtmlType } from '../print-html/print-html.model'
import { PrintHtmlSettingApi } from './print-html-setting.api'
import type {
  PrintHtmlSettingGetListQuery,
  PrintHtmlSettingGetOneQuery,
  PrintHtmlSettingGetQuery,
} from './print-html-setting.dto'
import { PrintHtmlSetting } from './print-html-setting.model'

const PrintHtmlSettingDBQuery = new CollectionQuery<PrintHtmlSetting>()

export class PrintHtmlSettingService {
  static loadedAll: boolean = false
  static printHtmlSettingAll: PrintHtmlSetting[] = []

  static fetchAll = (() => {
    const start = async () => {
      try {
        const { printHtmlSettingList } = await PrintHtmlSettingApi.getList({ sort: { id: 'DESC' } })
        PrintHtmlSettingService.printHtmlSettingAll = printHtmlSettingList
      } catch (error: any) {
        console.log('🚀 ~ print-html.service.ts:27 ~  ~ start ~ error:', error)
      }
    }
    let fetching: any = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetching || !PrintHtmlSettingService.loadedAll || options.refetch) {
        PrintHtmlSettingService.loadedAll = true
        fetching = start()
      }
      await fetching
    }
  })()

  private static executeQuery(all: PrintHtmlSetting[], query: PrintHtmlSettingGetQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        return PrintHtmlSettingDBQuery.executeFilter(i, filter as any)
      })
    }
    if (query.sort) {
      data = PrintHtmlSettingDBQuery.executeSort(data, query.sort)
    }
    return data
  }

  static async executeRelation(
    printHtmlSettingList: PrintHtmlSetting[],
    relation: PrintHtmlSettingGetQuery['relation'],
  ) {
    try {
      const printHtmlSettingIdList = printHtmlSettingList.map((i) => i.id)
    } catch (error) {
      console.log('🚀 ~ printHtmlSetting.service.ts:78 ~ PrintHtmlSettingService ~ error:', error)
    }
  }

  static async getAll(options?: { refetch?: boolean }) {
    await PrintHtmlSettingService.fetchAll({ refetch: !!options?.refetch })
    return PrintHtmlSettingService.printHtmlSettingAll
  }

  static async list(query: PrintHtmlSettingGetListQuery, options?: { refetch: boolean }) {
    await PrintHtmlSettingService.fetchAll({ refetch: !!options?.refetch })
    const data = PrintHtmlSettingService.executeQuery(
      PrintHtmlSettingService.printHtmlSettingAll,
      query,
    )
    return PrintHtmlSetting.fromList(data)
  }

  static async getOne(query: PrintHtmlSettingGetOneQuery, options?: { refetch: boolean }) {
    await PrintHtmlSettingService.fetchAll({ refetch: !!options?.refetch })

    const data = PrintHtmlSettingService.executeQuery(
      PrintHtmlSettingService.printHtmlSettingAll,
      query,
    )
    if (data.length > 0) {
      return PrintHtmlSetting.from(data[0])
    }
    return null
  }

  static async replaceAll(body: {
    replaceAll: { id: number; printHtmlType: PrintHtmlType; printHtmlId: number }[]
  }) {
    const response = await PrintHtmlSettingApi.replaceAll(body)
    PrintHtmlSettingService.loadedAll = false
    return
  }
}
