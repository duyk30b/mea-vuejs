import { customFilter } from '../../utils'
import { RadiologyApi } from './radiology.api'
import type { RadiologyPaginationQuery } from './radiology.dto'
import { Radiology } from './radiology.model'

export class RadiologyService {
  static loadedAll: boolean = false
  static radiologyAll: Radiology[]

  static loadedExample: boolean = false
  static radiologyExampleList: Radiology[]

  static async getAll() {
    if (!RadiologyService.loadedAll) {
      const fetchData = await RadiologyApi.list({})
      RadiologyService.radiologyAll = fetchData.data
      RadiologyService.radiologyAll.sort((a, b) => {
        return a.priority > b.priority ? 1 : -1 // sắp xêp tăng dần
      })
      RadiologyService.loadedAll = true
    }

    return Radiology.fromList(RadiologyService.radiologyAll)
  }

  static async pagination(options: RadiologyPaginationQuery) {
    const page = options.page || 1
    const limit = options.limit || 10
    const filter = options.filter || {}
    const all = await RadiologyService.getAll()
    const dataFilter = all.filter((i) => {
      if (filter.radiologyGroupId != null) {
        if (filter.radiologyGroupId !== i.radiologyGroupId) {
          return false
        }
      }
      if (filter.name) {
        if (filter.name.LIKE) {
          return customFilter(i.name || '', filter.name.LIKE, 2)
        }
      }
      return true
    })
    if (options.sort) {
      if (options.sort?.priority) {
        dataFilter.sort((a, b) => {
          if (options.sort?.priority === 'ASC') return a.priority < b.priority ? -1 : 1
          if (options.sort?.priority === 'DESC') return a.priority > b.priority ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      }
    }

    const data = dataFilter.slice((page - 1) * limit, page * limit)
    return { data, meta: { total: all.length } }
  }

  static async exampleList() {
    if (!RadiologyService.loadedExample) {
      RadiologyService.radiologyExampleList = await RadiologyApi.exampleList()
      RadiologyService.loadedExample = true
    }

    return RadiologyService.radiologyExampleList
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
    RadiologyService.loadedAll = false
    return result
  }
}
