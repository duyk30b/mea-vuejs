import { IndexedDBQuery } from '@/core/indexed-db/_base/indexed-db.query'
import { ref } from 'vue'
import { ESArray } from '../../utils'
import { PrintHtml, PrintHtmlService } from '../print-html'
import { Radiology } from '../radiology/radiology.model'
import { RadiologyService } from '../radiology/radiology.service'
import { User, UserService } from '../user'
import { RadiologySampleApi } from './radiology-sample.api'
import type {
  RadiologySampleDetailQuery,
  RadiologySampleGetQuery,
  RadiologySampleListQuery,
  RadiologySamplePaginationQuery,
} from './radiology-sample.dto'
import { RadiologySample } from './radiology-sample.model'

const RadiologySampleDBQuery = new IndexedDBQuery<RadiologySample>()

export class RadiologySampleService {
  static loadedAll: boolean = false
  static radiologySampleAll = ref<RadiologySample[]>([])
  static radiologySampleMap = ref<Record<string, RadiologySample>>({})

  private static fetchAll = (() => {
    const start = async () => {
      try {
        const radiologySampleAll = await RadiologySampleApi.list({ sort: { priority: 'ASC' } })
        RadiologySampleService.radiologySampleAll.value = radiologySampleAll
        RadiologySampleService.radiologySampleMap.value = ESArray.arrayToKeyValue(
          radiologySampleAll,
          'id',
        )
      } catch (error: any) {
        console.log('🚀 ~ radiology-sample.service.ts:30 ~ fetchAll ~ error:', error)
      }
    }
    let fetchPromise: Promise<void> | null = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetchPromise || !RadiologySampleService.loadedAll || options.refetch) {
        RadiologySampleService.loadedAll = true
        fetchPromise = start()
      }
      await fetchPromise
    }
  })()

  private static async executeQuery(all: RadiologySample[], query: RadiologySampleGetQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        return RadiologySampleDBQuery.executeFilter(i, filter as any)
      })
    }
    if (query.relation) {
      if (query.relation.printHtml) {
        const printHtmlMap = await PrintHtmlService.getMap()
        data.forEach((i) => {
          i.printHtml = PrintHtml.from(printHtmlMap[i.printHtmlId])
        })
      }
    }
    if (query.sort) {
      data = RadiologySampleDBQuery.executeSort(data, query.sort)
    }
    return data
  }

  static async executeRelation(
    radiologySampleList: RadiologySample[],
    relation: RadiologySampleGetQuery['relation'],
  ) {
    try {
      const radiologySampleIdList = radiologySampleList.map((i) => i.id)

      const [printHtmlMap, radiologyMap, userMap] = await Promise.all([
        relation?.printHtml ? PrintHtmlService.getMap() : <Record<string, PrintHtml>>{},
        relation?.radiology ? RadiologyService.getMap() : <Record<string, Radiology>>{},
        relation?.user ? UserService.getMap() : <Record<string, User>>{},
      ])

      radiologySampleList.forEach((radiologySample) => {
        if (relation?.printHtml) {
          radiologySample.printHtml = printHtmlMap[radiologySample.printHtmlId]
        }
        if (relation?.radiology) {
          radiologySample.radiology = radiologyMap[radiologySample.radiologyId]
        }
        if (relation?.user) {
          radiologySample.user = userMap[radiologySample.userId]
        }
      })
    } catch (error) {
      console.log('🚀 ~ radiology-sample.service.ts:91 ~ RadiologySampleService ~ error:', error)
    }
  }

  static async getMap(options?: { refetch?: boolean }) {
    await RadiologySampleService.fetchAll({ refetch: !!options?.refetch })
    return RadiologySampleService.radiologySampleMap.value
  }

  static async getAll(options?: { refetch?: boolean }) {
    await RadiologySampleService.fetchAll({ refetch: !!options?.refetch })
    return RadiologySampleService.radiologySampleAll.value
  }

  static async pagination(query: RadiologySamplePaginationQuery, options?: { refetch: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await RadiologySampleService.fetchAll({ refetch: !!options?.refetch })

    const dataQuery = await RadiologySampleService.executeQuery(
      RadiologySampleService.radiologySampleAll.value,
      query,
    )
    const data = dataQuery.slice((page - 1) * limit, page * limit)

    if (query.relation) {
      await RadiologySampleService.executeRelation(data, query.relation)
    }
    return {
      data: RadiologySample.fromList(data),
      meta: { total: dataQuery.length },
    }
  }

  static async list(query: RadiologySampleListQuery, options?: { refetch: boolean }) {
    await RadiologySampleService.fetchAll({ refetch: !!options?.refetch })
    const data = await RadiologySampleService.executeQuery(
      RadiologySampleService.radiologySampleAll.value,
      query,
    )
    return RadiologySample.fromList(data)
  }

  static async detail(
    id: number,
    query: RadiologySampleDetailQuery = {},
    options?: { refetch?: boolean; query?: boolean },
  ) {
    let radiologySample: RadiologySample | undefined
    if (options?.query) {
      radiologySample = await RadiologySampleApi.detail(id, query)
      const findIndex = RadiologySampleService.radiologySampleAll.value.findIndex(
        (i) => i.id === id,
      )
      if (findIndex !== -1) {
        RadiologySampleService.radiologySampleAll.value[findIndex] = radiologySample
      }
      RadiologySampleService.radiologySampleMap.value[radiologySample.id] = radiologySample
    } else {
      await RadiologySampleService.fetchAll({ refetch: !!options?.refetch })
      radiologySample =
        RadiologySampleService.radiologySampleAll.value.find((i) => i.id === id) ||
        RadiologySample.blank()
      if (query.relation) {
        await RadiologySampleService.executeRelation([radiologySample!], query.relation)
      }
    }

    return radiologySample ? RadiologySample.from(radiologySample) : RadiologySample.blank()
  }

  static async createOne(body: { radiologySample: RadiologySample }) {
    const result = await RadiologySampleApi.createOne(body)
    RadiologySampleService.loadedAll = false
    return result
  }

  static async updateOne(id: number, body: { radiologySample: RadiologySample }) {
    const result = await RadiologySampleApi.updateOne(id, body)
    RadiologySampleService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await RadiologySampleApi.destroyOne(id)
    RadiologySampleService.loadedAll = false
    return result
  }

  static generatePriority() {
    let maxPriority = 0
    RadiologySampleService.radiologySampleAll.value.forEach((i) => {
      if (i.priority > maxPriority) {
        maxPriority = i.priority
      }
    })
    maxPriority++
    return maxPriority
  }
}
