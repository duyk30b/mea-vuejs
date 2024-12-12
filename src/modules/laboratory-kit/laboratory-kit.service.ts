import { LaboratoryKitApi } from './laboratory-kit.api'
import type { LaboratoryKitListQuery, LaboratoryKitPaginationQuery } from './laboratory-kit.dto'
import { LaboratoryKit } from './laboratory-kit.model'

export class LaboratoryKitService {
  static loadedAll: boolean = false

  static laboratoryKitAll: LaboratoryKit[] = []

  private static async getAll() {
    if (LaboratoryKitService.loadedAll) return
    const { data } = await LaboratoryKitApi.list({})
    LaboratoryKitService.laboratoryKitAll = data
    LaboratoryKitService.loadedAll = true
  }

  static async pagination(options: LaboratoryKitPaginationQuery) {
    const page = options.page || 1
    const limit = options.limit || 10
    await LaboratoryKitService.getAll()
    let data = LaboratoryKitService.laboratoryKitAll
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
    data = data.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: LaboratoryKitService.laboratoryKitAll.length },
    }
  }

  static async list(options: LaboratoryKitListQuery) {
    const filter = options.filter || {}
    await LaboratoryKitService.getAll()
    let data = LaboratoryKitService.laboratoryKitAll
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
    return LaboratoryKit.fromList(data)
  }

  static async createOne(laboratoryKit: LaboratoryKit) {
    const result = await LaboratoryKitApi.createOne(laboratoryKit)
    LaboratoryKitService.loadedAll = false
    return result
  }

  static async updateOne(id: number, laboratoryKit: LaboratoryKit) {
    const result = await LaboratoryKitApi.updateOne(id, laboratoryKit)
    LaboratoryKitService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await LaboratoryKitApi.destroyOne(id)
    LaboratoryKitService.loadedAll = false
    return result
  }
}
