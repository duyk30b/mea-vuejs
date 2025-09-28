import { IndexedDBQuery } from '@/core/indexed-db/_base/indexed-db.query'
import { ref } from 'vue'
import { ESArray } from '../../utils'
import { Laboratory, LaboratoryService } from '../laboratory'
import { ProcedureService, type Procedure } from '../procedure'
import { Product, ProductService } from '../product'
import { Radiology, RadiologyService } from '../radiology'
import { RegimenService, type Regimen } from '../regimen'
import { DiscountApi } from './discount.api'
import type {
  DiscountDetailQuery,
  DiscountGetQuery,
  DiscountListQuery,
  DiscountPaginationQuery,
} from './discount.dto'
import { Discount, DiscountInteractType } from './discount.model'

const DiscountDBQuery = new IndexedDBQuery<Discount>()

export class DiscountService {
  static loadedAll: boolean = false
  static discountAll: Discount[] = []
  static discountMap = ref<Record<string, Discount>>({})

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng loadedAll
  private static fetchAll = (() => {
    const start = async () => {
      try {
        const discountAll = await DiscountApi.list({})
        DiscountService.discountAll = discountAll
        DiscountService.discountMap.value = ESArray.arrayToKeyValue(discountAll, 'id')
      } catch (error: any) {
        console.log('🚀 ~ discount.service.ts:32 ~ DiscountService ~ start ~ error:', error)
      }
    }
    let fetching: any = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetching || !DiscountService.loadedAll || options.refetch) {
        DiscountService.loadedAll = true
        fetching = start()
      }
      await fetching
    }
  })()

  private static executeQuery(all: Discount[], query: DiscountGetQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        return DiscountDBQuery.executeFilter(i, filter)
      })
    }
    if (query.sort) {
      data = DiscountDBQuery.executeSort(data, query.sort)
    }
    return data
  }

  static async executeRelation(discountList: Discount[], relation: DiscountGetQuery['relation']) {
    try {
      const productIdList = discountList
        .filter((i) => i.discountInteractType === DiscountInteractType.Product)
        .map((i) => i.discountInteractId)

      const [productMap, regimenMap, procedureMap, laboratoryMap, radiologyMap] = await Promise.all(
        [
          relation?.product
            ? ProductService.map({ filter: { id: { IN: productIdList } } })
            : <Record<string, Product>>{},
          relation?.regimen ? RegimenService.getMap() : <Record<string, Regimen>>{},
          relation?.procedure ? ProcedureService.getMap() : <Record<string, Procedure>>{},
          relation?.laboratory ? LaboratoryService.getMap() : <Record<string, Laboratory>>{},
          relation?.radiology ? RadiologyService.getMap() : <Record<string, Radiology>>{},
        ],
      )

      discountList.forEach((i) => {
        if (relation?.product) {
          if (i.discountInteractType === DiscountInteractType.Product) {
            i.product = productMap[i.discountInteractId]
          }
        }
        if (relation?.regimen) {
          if (i.discountInteractType === DiscountInteractType.Regimen) {
            i.regimen = regimenMap[i.discountInteractId]
          }
        }
        if (relation?.procedure) {
          if (i.discountInteractType === DiscountInteractType.Procedure) {
            i.procedure = procedureMap[i.discountInteractId]
          }
        }
        if (relation?.laboratory) {
          if (i.discountInteractType === DiscountInteractType.Laboratory) {
            i.laboratory = laboratoryMap[i.discountInteractId]
          }
        }
        if (relation?.radiology) {
          if (i.discountInteractType === DiscountInteractType.Radiology) {
            i.radiology = radiologyMap[i.discountInteractId]
          }
        }
      })
    } catch (error) {
      console.log('🚀 ~ discount.service.ts:97 ~ DiscountService ~ executeRelation ~ error:', error)
    }
  }

  static async refreshRelation(data?: Discount[]) {
    if (!data?.length) return data
    await DiscountService.executeRelation(data, {
      laboratory: true,
      procedure: true,
      product: true,
      radiology: true,
      regimen: true,
    })
  }

  static async getMap(options?: { refetch: boolean }) {
    await DiscountService.fetchAll({ refetch: !!options?.refetch })
    return DiscountService.discountMap.value
  }

  static async getAll(options?: { refetch: boolean }) {
    await DiscountService.fetchAll({ refetch: !!options?.refetch })
    return DiscountService.discountAll
  }

  static async pagination(query: DiscountPaginationQuery, options?: { refetch: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await DiscountService.fetchAll({ refetch: !!options?.refetch })
    const dataQuery = DiscountService.executeQuery(DiscountService.discountAll, query)
    const data = dataQuery.slice((page - 1) * limit, page * limit)
    if (query.relation) {
      await DiscountService.executeRelation(data, query.relation)
    }
    return {
      data: Discount.fromList(data),
      meta: { total: dataQuery.length },
    }
  }

  static async list(query: DiscountListQuery, options?: { refetch: boolean }) {
    await DiscountService.fetchAll({ refetch: !!options?.refetch })

    const data = DiscountService.executeQuery(DiscountService.discountAll, query)
    return Discount.fromList(data)
  }

  static async detail(id: number, options: DiscountDetailQuery = {}) {
    const discount = await DiscountApi.detail(id, options)
    if (discount && options.relation) {
      const findIndex = DiscountService.discountAll.findIndex((i) => i.id === id)
      if (findIndex !== -1) {
        DiscountService.discountAll[findIndex] = discount
      }
    }
    return discount
  }

  static async createOne(data: Discount) {
    const discountResult = await DiscountApi.createOne(data)
    await DiscountService.refreshRelation([discountResult])
    DiscountService.loadedAll = false
    return discountResult
  }

  static async updateOne(id: number, data: Discount) {
    const discountResult = await DiscountApi.updateOne(id, data)
    await DiscountService.refreshRelation([discountResult])
    DiscountService.loadedAll = false
    return discountResult
  }

  static async destroyOne(id: number) {
    const result = await DiscountApi.destroyOne(id)
    DiscountService.loadedAll = false
    return result
  }
}
