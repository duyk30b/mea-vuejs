import { IndexedDBQuery } from '@/core/indexed-db/_base/indexed-db.query'
import { ref } from 'vue'
import { ESArray } from '../../utils'
import { DiscountInteractType, DiscountService, type Discount } from '../discount'
import { LaboratoryGroup, LaboratoryGroupService } from '../laboratory-group'
import { PositionInteractType, PositionService, type Position } from '../position'
import { LaboratoryApi } from './laboratory.api'
import type {
  LaboratoryDetailQuery,
  LaboratoryGetQuery,
  LaboratoryListQuery,
  LaboratoryPaginationQuery,
} from './laboratory.dto'
import { Laboratory } from './laboratory.model'

const LaboratoryDBQuery = new IndexedDBQuery<Laboratory>()

export class LaboratoryService {
  static loadedAll: boolean = false
  static laboratoryAll: Laboratory[] = []
  static laboratoryTree: Laboratory[] = []
  static laboratoryMap = ref<Record<string, Laboratory>>({})

  private static fetchAll = (() => {
    const start = async () => {
      try {
        const laboratoryAll = await LaboratoryApi.list({ sort: { id: 'DESC' } })
        const laboratoryMap = ESArray.arrayToKeyValue(laboratoryAll, 'id')

        const laboratoryTree = laboratoryAll.filter((i) => i.level === 1)
        laboratoryAll.forEach((i) => {
          try {
            i.optionsParse = JSON.parse(i.options)
          } catch (error) {
            i.optionsParse = []
          }
          if (i.level === 2) {
            if (!laboratoryMap[i.parentId].children) {
              laboratoryMap[i.parentId].children = []
            }
            laboratoryMap[i.parentId].children?.push(i)
          }
        })
        LaboratoryService.laboratoryAll = laboratoryAll
        LaboratoryService.laboratoryTree = laboratoryTree
        LaboratoryService.laboratoryMap.value = laboratoryMap
      } catch (error: any) {
        console.log('🚀 ~ file: laboratory.service.ts:35 ~ LaboratoryService ~ error:', error)
      }
    }
    let fetchPromise: Promise<void> | null = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetchPromise || !LaboratoryService.loadedAll || options.refetch) {
        LaboratoryService.loadedAll = true
        fetchPromise = start()
      }
      await fetchPromise
    }
  })()

  private static executeQuery(all: Laboratory[], query: LaboratoryGetQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        return LaboratoryDBQuery.executeFilter(i, filter as any)
      })
    }
    if (query.sort) {
      data = LaboratoryDBQuery.executeSort(data, query.sort)
    }
    return data
  }

  static async executeRelation(
    laboratoryList: Laboratory[],
    relation: LaboratoryGetQuery['relation'],
  ) {
    try {
      const laboratoryIdList = laboratoryList.map((i) => i.id)

      const [laboratoryGroupMap, discountAll, positionAll] = await Promise.all([
        relation?.laboratoryGroup
          ? LaboratoryGroupService.getMap()
          : <Record<string, LaboratoryGroup>>{},
        relation?.discountList ? DiscountService.getAll() : <Discount[]>[],
        relation?.positionList ? PositionService.getAll() : <Position[]>[],
      ])

      laboratoryList.forEach((laboratory) => {
        if (relation?.laboratoryGroup) {
          laboratory.laboratoryGroup = laboratoryGroupMap[laboratory.laboratoryGroupId]
        }
        if (relation?.discountList) {
          laboratory.discountList = discountAll.filter((i) => {
            return (
              i.discountInteractType === DiscountInteractType.Laboratory &&
              i.discountInteractId === laboratory.id
            )
          })
          laboratory.discountListExtra = discountAll.filter((i) => {
            return (
              i.discountInteractType === DiscountInteractType.Laboratory &&
              i.discountInteractId === 0
            )
          })
        }
        if (relation?.positionList) {
          laboratory.positionList = positionAll.filter((i) => {
            return (
              i.positionType === PositionInteractType.Laboratory &&
              i.positionInteractId === laboratory.id
            )
          })
        }
      })
    } catch (error) {
      console.log('🚀 ~ laboratory.service.ts:118 ~ LaboratoryService ~ error:', error)
    }
  }

  static async getMap(options?: { refetch: boolean }) {
    await LaboratoryService.fetchAll({ refetch: !!options?.refetch })
    return LaboratoryService.laboratoryMap.value
  }

  static async getTree(options?: { refetch: boolean }) {
    await LaboratoryService.fetchAll({ refetch: !!options?.refetch })
    return LaboratoryService.laboratoryTree
  }

  static async pagination(query: LaboratoryPaginationQuery, options?: { refetch: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await LaboratoryService.fetchAll({ refetch: !!options?.refetch })

    const dataQuery = LaboratoryService.executeQuery(LaboratoryService.laboratoryTree, query)
    const data = dataQuery.slice((page - 1) * limit, page * limit)
    if (query.relation) {
      await LaboratoryService.executeRelation(data, query.relation)
    }
    return {
      data: Laboratory.fromList(data),
      meta: { total: dataQuery.length },
    }
  }

  static async list(query: LaboratoryListQuery, options?: { refetch: boolean }) {
    await LaboratoryService.fetchAll({ refetch: !!options?.refetch })
    const data = LaboratoryService.executeQuery(LaboratoryService.laboratoryTree, query)

    return Laboratory.fromList(data)
  }

  static async detail(
    id: number,
    query: LaboratoryDetailQuery = {},
    options?: { refetch?: boolean; query?: boolean },
  ) {
    let laboratory: Laboratory | undefined
    if (options?.query) {
      laboratory = await LaboratoryApi.detail(id, query)
      // không sửa vì có thể dữ liệu get về không có laboratoryChildren
      // const findIndex = LaboratoryService.laboratoryAll.findIndex((i) => i.id === id)
      // if (findIndex !== -1) LaboratoryService.laboratoryAll[findIndex] = laboratory
      // LaboratoryService.laboratoryMap.value[laboratory.id] = laboratory
    } else {
      await LaboratoryService.fetchAll({ refetch: !!options?.refetch })
      laboratory = LaboratoryService.laboratoryAll.find((i) => i.id === id)
    }

    return laboratory ? Laboratory.from(laboratory) : Laboratory.blank()
  }

  static async create(body: {
    laboratory: Laboratory
    laboratoryChildren?: Laboratory[]
    discountList?: Discount[]
    positionList?: Position[]
  }) {
    const result = await LaboratoryApi.create(body)
    LaboratoryService.loadedAll = false
    return result
  }

  static async update(
    id: number,
    body: {
      laboratory: Laboratory
      laboratoryChildren?: Laboratory[]
      discountList?: Discount[]
      positionList?: Position[]
    },
  ) {
    const result = await LaboratoryApi.update(id, body)
    LaboratoryService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await LaboratoryApi.destroyOne(id)
    LaboratoryService.loadedAll = false
    return result
  }

  static async systemCopy(body: { laboratoryIdList: number[] }) {
    const result = await LaboratoryApi.systemCopy(body)
    LaboratoryService.loadedAll = false
    return result
  }
}
