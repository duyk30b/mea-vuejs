import { customFilter, DString } from '../../utils'
import { RadiologyApi } from './radiology.api'
import type {
  RadiologyGetQuery,
  RadiologyListQuery,
  RadiologyPaginationQuery,
} from './radiology.dto'
import { Radiology } from './radiology.model'

export class RadiologyService {
  static loadedAll: boolean = false
  static radiologyAll: Radiology[] = []

  private static async getAll() {
    if (RadiologyService.loadedAll) return
    const { data } = await RadiologyApi.list({})
    RadiologyService.radiologyAll = data
    RadiologyService.loadedAll = true
  }

  private static executeQuery(all: Radiology[], query: RadiologyGetQuery) {
    let data = all
    if (query.filter) {
      const filter = query.filter
      data = data.filter((i) => {
        if (filter.radiologyGroupId != null) {
          if (filter.radiologyGroupId !== i.radiologyGroupId) {
            return false
          }
        }
        if (filter.name) {
          if (filter.name.LIKE && !customFilter(i.name || '', filter.name.LIKE, 2)) {
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
      if (query.sort.priority) {
        data.sort((a, b) => {
          if (query.sort?.priority === 'ASC') return a.priority < b.priority ? -1 : 1
          if (query.sort?.priority === 'DESC') return a.priority > b.priority ? -1 : 1
          return a.priority > b.priority ? -1 : 1
        })
      }
    }
    return data
  }

  static async pagination(options: RadiologyPaginationQuery) {
    const page = options.page || 1
    const limit = options.limit || 10
    await RadiologyService.getAll()

    let data = RadiologyService.executeQuery(RadiologyService.radiologyAll, options)
    data = data.slice((page - 1) * limit, page * limit)
    return {
      data: Radiology.fromList(data),
      meta: { total: RadiologyService.radiologyAll.length },
    }
  }

  static async list(options: RadiologyListQuery) {
    const filter = options.filter || {}
    await RadiologyService.getAll()
    const data = RadiologyService.executeQuery(RadiologyService.radiologyAll, options)
    return Radiology.fromList(data)
  }

  static async createOne(radiology: Radiology) {
    const result = await RadiologyApi.createOne(radiology)
    RadiologyService.loadedAll = false
    return result
  }

  static async updateOne(id: number, radiology: Radiology) {
    const result = await RadiologyApi.updateOne(id, radiology)
    RadiologyService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await RadiologyApi.destroyOne(id)
    if (result.success) {
      RadiologyService.loadedAll = false
    }
    return result
  }

  static async systemCopy(body: { radiologyIdList: number[] }) {
    const result = await RadiologyApi.systemCopy(body)
    RadiologyService.loadedAll = false
    return result
  }
}
