import { arrayToKeyValue } from '../../utils'
import { Laboratory, LaboratoryService } from '../laboratory'
import { ProcedureService, type Procedure } from '../procedure'
import { Product, ProductService } from '../product'
import { Radiology, RadiologyService } from '../radiology'
import { DiscountApi } from './discount.api'
import type {
  DiscountDetailQuery,
  DiscountGetQuery,
  DiscountListQuery,
  DiscountPaginationQuery,
} from './discount.dto'
import { Discount, DiscountInteractType } from './discount.model'

export class DiscountService {
  static loadedAll: boolean = false
  static discountAll: Discount[] = []

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng loadedAll
  private static fetchAll = (() => {
    const start = async () => {
      try {
        DiscountService.discountAll = await DiscountApi.list({})
      } catch (error: any) {
        console.log('🚀 ~ file: commission.service.ts:20 ~ fetchAll ~ error:', error)
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
        if (filter.discountInteractType != null) {
          if (filter.discountInteractType !== i.discountInteractType) {
            return false
          }
        }
        if (filter.discountInteractId != null) {
          if (filter.discountInteractId !== i.discountInteractId) {
            return false
          }
        }
        return true
      })
    }
    if (query.sort) {
      if (query.sort.id) {
        data.sort((a, b) => {
          if (query.sort?.id === 'ASC') return a.id < b.id ? -1 : 1
          if (query.sort?.id === 'DESC') return a.id > b.id ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      }
    }
    return data
  }

  static async getMap() {
    await DiscountService.fetchAll()
    const commissionMap = arrayToKeyValue(DiscountService.discountAll, 'id')
    return commissionMap
  }

  static async pagination(query: DiscountPaginationQuery, options?: { refetch: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await DiscountService.fetchAll({ refetch: !!options?.refetch })
    let data = DiscountService.executeQuery(DiscountService.discountAll, query)
    data = data.slice((page - 1) * limit, page * limit)
    return {
      data: Discount.fromList(data),
      meta: { total: DiscountService.discountAll.length },
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

  static async createOne(discount: Discount) {
    const result = await DiscountApi.createOne(discount)
    DiscountService.loadedAll = false
    return result
  }

  static async updateOne(id: number, discount: Discount) {
    const result = await DiscountApi.updateOne(id, discount)
    DiscountService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await DiscountApi.destroyOne(id)
    DiscountService.loadedAll = false
    return result
  }

  static async refreshRelation(discountList: Discount[], relation: DiscountGetQuery['relation']) {
    try {
      const productIdList = discountList
        .filter((i) => i.discountInteractType === DiscountInteractType.Product)
        .map((i) => i.discountInteractId)

      const [productMap, procedureMap, laboratoryMap, radiologyMap] = await Promise.all([
        relation?.product
          ? ProductService.map({ filter: { id: { IN: productIdList } } })
          : <Record<string, Product>>{},
        relation?.procedure ? ProcedureService.getMap() : <Record<string, Procedure>>{},
        relation?.laboratory ? LaboratoryService.getMap() : <Record<string, Laboratory>>{},
        relation?.radiology ? RadiologyService.getMap() : <Record<string, Radiology>>{},
      ])

      discountList.forEach((i) => {
        if (relation?.product) {
          if (i.discountInteractType === DiscountInteractType.Product) {
            i.product = productMap[i.discountInteractId]
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
      console.log('🚀 ~ discount.service.ts:160 ~ refreshRelation ~ error:', error)
    }
  }
}
