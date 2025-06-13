import { IndexedDBQuery } from '@/core/indexed-db/_base/indexed-db.query'
import { ref } from 'vue'
import { ESArray } from '../../utils'
import { DiscountInteractType, DiscountService, type Discount } from '../discount'
import { Position, PositionInteractType, PositionService } from '../position'
import { PrintHtml, PrintHtmlService } from '../print-html'
import { RadiologyGroup, RadiologyGroupService } from '../radiology-group'
import { RadiologyApi } from './radiology.api'
import type {
    RadiologyDetailQuery,
    RadiologyGetQuery,
    RadiologyListQuery,
    RadiologyPaginationQuery,
} from './radiology.dto'
import { Radiology } from './radiology.model'

const RadiologyDBQuery = new IndexedDBQuery<Radiology>()

export class RadiologyService {
  static loadedAll: boolean = false
  static radiologyAll: Radiology[] = []
  static radiologyMap = ref<Record<string, Radiology>>({})

  private static fetchAll = (() => {
    const start = async () => {
      try {
        const radiologyAll = await RadiologyApi.list({})
        RadiologyService.radiologyAll = radiologyAll
        RadiologyService.radiologyMap.value = ESArray.arrayToKeyValue(radiologyAll, 'id')
      } catch (error: any) {
        console.log('🚀 ~ radiology.service.ts:27 ~ RadiologyService ~ start ~ error:', error)
      }
    }
    let fetchPromise: Promise<void> | null = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetchPromise || !RadiologyService.loadedAll || options.refetch) {
        RadiologyService.loadedAll = true
        fetchPromise = start()
      }
      await fetchPromise
    }
  })()

  private static async executeQuery(all: Radiology[], query: RadiologyGetQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        return RadiologyDBQuery.executeFilter(i, filter as any)
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
      data = RadiologyDBQuery.executeSort(data, query.sort)
    }
    return data
  }

  static async executeRelation(
    radiologyList: Radiology[],
    relation: RadiologyGetQuery['relation'],
  ) {
    try {
      const radiologyIdList = radiologyList.map((i) => i.id)

      const [printHtmlMap, radiologyGroupMap, discountAll, positionAll] = await Promise.all([
        relation?.printHtml ? PrintHtmlService.getMap() : <Record<string, PrintHtml>>{},
        relation?.radiologyGroup
          ? RadiologyGroupService.getMap()
          : <Record<string, RadiologyGroup>>{},
        relation?.discountList ? DiscountService.getAll() : <Discount[]>[],
        relation?.positionList ? PositionService.getAll() : <Position[]>[],
      ])

      radiologyList.forEach((radiology) => {
        if (relation?.printHtml) {
          radiology.printHtml = printHtmlMap[radiology.printHtmlId]
        }
        if (relation?.radiologyGroup) {
          radiology.radiologyGroup = radiologyGroupMap[radiology.radiologyGroupId]
        }
        if (relation?.discountList) {
          radiology.discountList = discountAll.filter((i) => {
            return (
              i.discountInteractType === DiscountInteractType.Radiology &&
              i.discountInteractId === radiology.id
            )
          })
          radiology.discountListExtra = discountAll.filter((i) => {
            return (
              i.discountInteractType === DiscountInteractType.Radiology &&
              i.discountInteractId === 0
            )
          })
        }
        if (relation?.positionList) {
          radiology.positionList = positionAll.filter((i) => {
            return (
              i.positionType === PositionInteractType.Radiology &&
              i.positionInteractId === radiology.id
            )
          })
        }
      })
    } catch (error) {
      console.log('🚀 ~ radiology.service.ts:113 ~ RadiologyService ~ error:', error)
    }
  }

  static async getAll(options?: { refetch: boolean }) {
    await RadiologyService.fetchAll({ refetch: !!options?.refetch })
    return RadiologyService.radiologyAll
  }

  static async getMap(options?: { refetch: boolean }) {
    await RadiologyService.fetchAll({ refetch: !!options?.refetch })
    return RadiologyService.radiologyMap.value
  }

  static async pagination(query: RadiologyPaginationQuery, options?: { refetch: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await RadiologyService.fetchAll({ refetch: !!options?.refetch })

    const dataQuery = await RadiologyService.executeQuery(RadiologyService.radiologyAll, query)
    const data = dataQuery.slice((page - 1) * limit, page * limit)

    if (query.relation) {
      await RadiologyService.executeRelation(data, query.relation)
    }
    return {
      data: Radiology.fromList(data),
      meta: { total: dataQuery.length },
    }
  }

  static async list(query: RadiologyListQuery, options?: { refetch: boolean }) {
    await RadiologyService.fetchAll({ refetch: !!options?.refetch })
    const data = await RadiologyService.executeQuery(RadiologyService.radiologyAll, query)
    if (query.relation) {
      await RadiologyService.executeRelation(data, query.relation)
    }
    return Radiology.fromList(data)
  }

  static async detail(
    id: number,
    query: RadiologyDetailQuery = {},
    options?: { refetch?: boolean; query?: boolean },
  ) {
    let radiology: Radiology | undefined
    if (options?.query) {
      radiology = await RadiologyApi.detail(id, query)
      const findIndex = RadiologyService.radiologyAll.findIndex((i) => i.id === id)
      if (findIndex !== -1) RadiologyService.radiologyAll[findIndex] = radiology
      RadiologyService.radiologyMap.value[radiology.id] = radiology
    } else {
      await RadiologyService.fetchAll({ refetch: !!options?.refetch })
      radiology = RadiologyService.radiologyAll.find((i) => i.id === id)
    }

    if (query.relation) {
      await RadiologyService.executeRelation([radiology!], query.relation)
    }

    return radiology ? Radiology.from(radiology) : Radiology.blank()
  }

  static async createOne(body: {
    radiology: Radiology
    positionList?: Position[]
    discountList?: Discount[]
  }) {
    const result = await RadiologyApi.createOne(body)
    return result
  }

  static async updateOne(
    id: number,
    body: {
      radiology: Radiology
      positionList?: Position[]
      discountList?: Discount[]
    },
  ) {
    const result = await RadiologyApi.updateOne(id, body)
    return result
  }

  static async destroyOne(id: number) {
    const result = await RadiologyApi.destroyOne(id)
    return result
  }

  static async systemCopy(body: { radiologyIdList: number[] }) {
    const result = await RadiologyApi.systemCopy(body)
    RadiologyService.loadedAll = false
    return result
  }
}
