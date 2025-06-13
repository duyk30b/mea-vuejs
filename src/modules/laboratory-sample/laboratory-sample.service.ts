import { LaboratorySampleApi } from './laboratory-sample.api'
import type { LaboratorySampleListQuery, LaboratorySamplePaginationQuery } from './laboratory-sample.dto'
import { LaboratorySample } from './laboratory-sample.model'

export class LaboratorySampleService {
  static loadedAll: boolean = false

  static laboratorySampleAll: LaboratorySample[] = []

  private static async getAll() {
    if (LaboratorySampleService.loadedAll) return
    const { data } = await LaboratorySampleApi.list({})
    LaboratorySampleService.laboratorySampleAll = data
    LaboratorySampleService.loadedAll = true
  }

  static async pagination(options: LaboratorySamplePaginationQuery) {
    const page = options.page || 1
    const limit = options.limit || 10
    await LaboratorySampleService.getAll()
    const dataQuery = LaboratorySampleService.laboratorySampleAll
    if (options.sort) {
      if (options.sort?.id) {
        dataQuery.sort((a, b) => {
          if (options.sort?.id === 'ASC') return a.id < b.id ? -1 : 1
          if (options.sort?.id === 'DESC') return a.id > b.id ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      }
      if (options.sort?.priority) {
        dataQuery.sort((a, b) => {
          if (options.sort?.priority === 'ASC') return a.priority < b.priority ? -1 : 1
          if (options.sort?.priority === 'DESC') return a.priority > b.priority ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      }
    }
    const data = dataQuery.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: LaboratorySampleService.laboratorySampleAll.length },
    }
  }

  static async list(options: LaboratorySampleListQuery) {
    const filter = options.filter || {}
    await LaboratorySampleService.getAll()
    let data = LaboratorySampleService.laboratorySampleAll
    if (options.filter) {
      data = data.filter((i) => {
        return true
      })
    }
    if (options.sort) {
      if (options.sort?.id) {
        data.sort((a, b) => {
          if (options.sort?.id === 'ASC') return a.id < b.id ? -1 : 1
          if (options.sort?.id === 'DESC') return a.id > b.id ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      }
      if (options.sort?.priority) {
        data.sort((a, b) => {
          if (options.sort?.priority === 'ASC') return a.priority < b.priority ? -1 : 1
          if (options.sort?.priority === 'DESC') return a.priority > b.priority ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      }
    }
    return LaboratorySample.fromList(data)
  }

  static async createOne(laboratorySample: LaboratorySample) {
    const result = await LaboratorySampleApi.createOne(laboratorySample)
    LaboratorySampleService.loadedAll = false
    return result
  }

  static async updateOne(id: number, laboratorySample: LaboratorySample) {
    const result = await LaboratorySampleApi.updateOne(id, laboratorySample)
    LaboratorySampleService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await LaboratorySampleApi.destroyOne(id)
    LaboratorySampleService.loadedAll = false
    return result
  }
}
