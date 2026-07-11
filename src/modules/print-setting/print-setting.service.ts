import { CollectionQuery } from '@/core/indexed-db/common/collection.query'
import { PrintSettingApi } from './print-setting.api'
import type {
  PrintSettingGetListQuery,
  PrintSettingGetOneQuery,
  PrintSettingGetQuery,
} from './print-setting.dto'
import { PrintSetting } from './print-setting.model'
import type { TemplateHtmlType } from '../template-html'

const PrintSettingDBQuery = new CollectionQuery<PrintSetting>()

export class PrintSettingService {
  static loadedAll: boolean = false
  static printSettingAll: PrintSetting[] = []

  static fetchAll = (() => {
    const start = async () => {
      try {
        const { printSettingList } = await PrintSettingApi.getList({ sort: { id: 'DESC' } })
        PrintSettingService.printSettingAll = printSettingList
      } catch (error: any) {
        console.log('🚀 ~ print-setting.service.ts:27 ~  ~ start ~ error:', error)
      }
    }
    let fetching: any = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetching || !PrintSettingService.loadedAll || options.refetch) {
        PrintSettingService.loadedAll = true
        fetching = start()
      }
      await fetching
    }
  })()

  private static executeQuery(all: PrintSetting[], query: PrintSettingGetQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        return PrintSettingDBQuery.executeFilter(i, filter as any)
      })
    }
    if (query.sort) {
      data = PrintSettingDBQuery.executeSort(data, query.sort)
    }
    return data
  }

  static async executeRelation(
    printSettingList: PrintSetting[],
    relation: PrintSettingGetQuery['relation'],
  ) {
    try {
      const printSettingIdList = printSettingList.map((i) => i.id)
    } catch (error) {
      console.log('🚀 ~ printSetting.service.ts:78 ~ PrintSettingService ~ error:', error)
    }
  }

  static async getAll(options?: { refetch?: boolean }) {
    await PrintSettingService.fetchAll({ refetch: !!options?.refetch })
    return PrintSettingService.printSettingAll
  }

  static async list(query: PrintSettingGetListQuery, options?: { refetch: boolean }) {
    await PrintSettingService.fetchAll({ refetch: !!options?.refetch })
    const data = PrintSettingService.executeQuery(
      PrintSettingService.printSettingAll,
      query,
    )
    return PrintSetting.fromList(data)
  }

  static async getOne(query: PrintSettingGetOneQuery, options?: { refetch: boolean }) {
    await PrintSettingService.fetchAll({ refetch: !!options?.refetch })

    const data = PrintSettingService.executeQuery(
      PrintSettingService.printSettingAll,
      query,
    )
    if (data.length > 0) {
      return PrintSetting.from(data[0])
    }
    return null
  }

  static async replaceAll(body: {
    replaceAll: { id: number; templateHtmlType: TemplateHtmlType; templateHtmlId: number }[]
  }) {
    const response = await PrintSettingApi.replaceAll(body)
    PrintSettingService.loadedAll = false
    return
  }
}
