import { CollectionQuery } from '@/core/indexed-db/common/collection.query'
import { ref } from 'vue'
import { ESArray } from '../../utils'
import { Laboratory, LaboratoryService } from '../laboratory'
import { LaboratoryGroup, LaboratoryGroupService } from '../laboratory-group'
import { Procedure, ProcedureService } from '../procedure'
import { Product, ProductService } from '../product'
import { Radiology, RadiologyService } from '../radiology'
import { Regimen, RegimenService } from '../regimen'
import { Role, RoleService } from '../role'
import { PositionApi } from './position.api'
import type {
  PositionDetailQuery,
  PositionGetQuery,
  PositionListQuery,
  PositionPaginationQuery,
} from './position.dto'
import { Position, PositionType } from './position.model'

const PositionDBQuery = new CollectionQuery<Position>()

export class PositionService {
  static loadedAll: boolean = false
  static positionAll: Position[] = []
  static positionMap = ref<Record<string, Position>>({})

  // chỉ cho phép gọi 1 lần, nếu muốn gọi lại thì phải dùng loadedAll
  private static fetchAll = (() => {
    const start = async () => {
      try {
        const positionAll = await PositionApi.list({})
        PositionService.positionAll = positionAll
        PositionService.positionMap.value = ESArray.arrayToKeyValue(positionAll, 'id')
      } catch (error: any) {
        console.log('🚀 ~ position.service.ts:34 ~ PositionService ~ start ~ error:', error)
      }
    }
    let fetching: any = null
    return async (options: { refetch?: boolean } = {}) => {
      if (!fetching || !PositionService.loadedAll || options.refetch) {
        PositionService.loadedAll = true
        fetching = start()
      }
      await fetching
    }
  })()

  private static executeQuery(all: Position[], query: PositionGetQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        return PositionDBQuery.executeFilter(i, filter as any)
      })
    }
    if (query.sort) {
      data = PositionDBQuery.executeSort(data, query.sort)
    }
    return data
  }

  static async executeRelation(positionList: Position[], relation: PositionGetQuery['relation']) {
    try {
      const productIdList = positionList
        .filter((i) => i.positionType === PositionType.ProductRequest)
        .map((i) => i.positionInteractId)

      const [
        roleMap,
        productMap,
        regimenMap,
        procedureMap,
        laboratoryMap,
        laboratoryGroupMap,
        radiologyMap,
      ] = await Promise.all([
        relation?.role ? RoleService.getMap() : <Record<string, Role>>{},
        relation?.productRequest
          ? ProductService.map({ filter: { id: { IN: productIdList } } })
          : <Record<string, Product>>{},
        relation?.regimenRequest ? RegimenService.getMap() : <Record<string, Regimen>>{},
        relation?.procedureRequest || relation?.procedureResult
          ? ProcedureService.getMap()
          : <Record<string, Procedure>>{},
        relation?.laboratoryRequest ? LaboratoryService.getMap() : <Record<string, Laboratory>>{},
        relation?.laboratoryGroupRequest || relation?.laboratoryGroupResult
          ? LaboratoryGroupService.getMap()
          : <Record<string, LaboratoryGroup>>{},
        relation?.radiologyRequest || relation?.radiologyResult
          ? RadiologyService.getMap()
          : <Record<string, Radiology>>{},
      ])

      positionList.forEach((i) => {
        if (relation?.role) {
          i.role = roleMap[i.roleId] || Role.blank()
        }
        if (relation?.productRequest) {
          if (i.positionType === PositionType.ProductRequest) {
            i.productRequest = productMap[i.positionInteractId]
          }
        }
        if (relation?.regimenRequest) {
          if (i.positionType === PositionType.RegimenRequest) {
            i.regimenRequest = regimenMap[i.positionInteractId]
          }
        }
        if (relation?.procedureRequest) {
          if (i.positionType === PositionType.ProcedureRequest) {
            i.procedureRequest = procedureMap[i.positionInteractId]
          }
        }
        if (relation?.procedureResult) {
          if (i.positionType === PositionType.ProcedureResult) {
            i.procedureResult = procedureMap[i.positionInteractId]
          }
        }
        if (relation?.laboratoryRequest) {
          if (i.positionType === PositionType.LaboratoryRequest) {
            i.laboratoryRequest = laboratoryMap[i.positionInteractId]
          }
        }
        if (relation?.laboratoryGroupRequest) {
          if (i.positionType === PositionType.LaboratoryGroupRequest) {
            i.laboratoryGroupRequest = laboratoryGroupMap[i.positionInteractId]
          }
        }
        if (relation?.laboratoryGroupResult) {
          if (i.positionType === PositionType.LaboratoryGroupResult) {
            i.laboratoryGroupResult = laboratoryGroupMap[i.positionInteractId]
          }
        }
        if (relation?.radiologyRequest) {
          if (i.positionType === PositionType.RadiologyRequest) {
            i.radiologyRequest = radiologyMap[i.positionInteractId]
          }
        }
        if (relation?.radiologyResult) {
          if (i.positionType === PositionType.RadiologyResult) {
            i.radiologyResult = radiologyMap[i.positionInteractId]
          }
        }
      })
    } catch (error) {
      console.log('🚀 ~ position.service.ts:127 ~  ~ executeRelation ~ error:', error)
    }
  }

  static async getMap(options?: { refetch: boolean }) {
    await PositionService.fetchAll({ refetch: !!options?.refetch })
    return PositionService.positionMap.value
  }

  static async getAll(options?: { refetch: boolean }) {
    await PositionService.fetchAll({ refetch: !!options?.refetch })
    return PositionService.positionAll
  }

  static async pagination(query: PositionPaginationQuery, options?: { refetch: boolean }) {
    const page = query.page || 1
    const limit = query.limit || 10
    await PositionService.fetchAll({ refetch: !!options?.refetch })
    const dataQuery = PositionService.executeQuery(PositionService.positionAll, query)
    const data = dataQuery.slice((page - 1) * limit, page * limit)
    if (query.relation) {
      await PositionService.executeRelation(data, query.relation)
    }
    return {
      data: Position.fromList(data),
      meta: { total: dataQuery.length },
    }
  }

  static async list(query: PositionListQuery, options?: { refetch: boolean }) {
    await PositionService.fetchAll({ refetch: !!options?.refetch })

    const data = PositionService.executeQuery(PositionService.positionAll, query)
    return Position.fromList(data)
  }

  static async detail(
    id: number,
    query: PositionDetailQuery = {},
    options?: { refetch?: boolean },
  ) {
    await PositionService.fetchAll({ refetch: !!options?.refetch })
    const position = PositionService.positionMap.value[id]
    if (position && query && query.relation) {
      await PositionService.executeRelation([position], query.relation)
    }
    return position ? Position.from(position) : Position.blank()
  }

  static async createOne(position: Position) {
    const result = await PositionApi.createOne(position)
    PositionService.loadedAll = false
    return result
  }

  static async updateOne(id: number, position: Position) {
    const result = await PositionApi.updateOne(id, position)
    PositionService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await PositionApi.destroyOne(id)
    PositionService.loadedAll = false
    return result
  }

  static async replaceList(options: {
    filter: PositionGetQuery['filter']
    positionData: Position[]
  }) {
    const result = await PositionApi.replaceList(options)
    PositionService.loadedAll = false
    return result
  }
}
