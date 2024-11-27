import { arrayToKeyValue, customFilter } from '../../utils'
import { LaboratoryApi } from './laboratory.api'
import type { LaboratoryListQuery, LaboratoryPaginationQuery } from './laboratory.dto'
import { Laboratory } from './laboratory.model'

export class LaboratoryService {
  static loadedAll: boolean = false
  static laboratoryAll: Laboratory[] = []
  static laboratoryMap: Record<string, Laboratory> = {}

  static loadedExample: boolean = false
  static laboratoryExampleList: Laboratory[]

  private static async getAll() {
    if (!LaboratoryService.loadedAll) {
      const { data } = await LaboratoryApi.list({})
      const laboratoryList = data.filter((i) => i.level === 1)
      const laboratoryMap = arrayToKeyValue(laboratoryList, 'id')
      data.forEach((i) => {
        try {
          i.optionsParse = JSON.parse(i.options)
        } catch (error) {
          i.optionsParse = []
        }
        if (!laboratoryMap[i.parentId].children) {
          laboratoryMap[i.parentId].children = []
        }
        if (i.level === 2) {
          laboratoryMap[i.parentId].children?.push(i)
        }
      })
      LaboratoryService.laboratoryAll = laboratoryList
      LaboratoryService.laboratoryMap = arrayToKeyValue(laboratoryList, 'id')
      LaboratoryService.loadedAll = true
    }
    return LaboratoryService.laboratoryAll
  }

  static async getMap() {
    await LaboratoryService.getAll()
    return LaboratoryService.laboratoryMap
  }

  static async list(options: LaboratoryListQuery) {
    const filter = options.filter || {}
    const all = await LaboratoryService.getAll()
    let data = all
    if (options.filter) {
      data = data.filter((i) => {
        if (filter.laboratoryGroupId != null) {
          if (filter.laboratoryGroupId !== i.laboratoryGroupId) {
            return false
          }
        }
        if (filter.level != null) {
          if (filter.level !== i.level) {
            return false
          }
        }
        if (filter.parentId != null) {
          if (filter.parentId !== i.parentId) {
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
    }
    return Laboratory.fromList(data)
  }

  static async pagination(options: LaboratoryPaginationQuery) {
    const page = options.page || 1
    const limit = options.limit || 10
    const filter = options.filter || {}
    const all = await LaboratoryService.getAll()
    let data = all
    if (options.filter) {
      data = data.filter((i) => {
        if (filter.laboratoryGroupId != null) {
          if (filter.laboratoryGroupId !== i.laboratoryGroupId) {
            return false
          }
        }
        if (filter.level != null) {
          if (filter.level !== i.level) {
            return false
          }
        }
        if (filter.parentId != null) {
          if (filter.parentId !== i.parentId) {
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
    }
    if (options.sort) {
      if (options.sort.id) {
        data.sort((a, b) => {
          if (options.sort?.id === 'ASC') return a.id < b.id ? -1 : 1
          if (options.sort?.id === 'DESC') return a.id > b.id ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      }
    }
    data = data.slice((page - 1) * limit, page * limit)
    data = Laboratory.fromList(data)
    return { data, meta: { total: all.length } }
  }

  static async exampleList() {
    if (!LaboratoryService.loadedExample) {
      LaboratoryService.laboratoryExampleList = await LaboratoryApi.exampleList()
      LaboratoryService.loadedExample = true
    }

    return LaboratoryService.laboratoryExampleList
  }

  static async create(laboratory: Laboratory) {
    const result = await LaboratoryApi.create(laboratory)
    LaboratoryService.loadedAll = false
    return result
  }

  static async update(id: number, laboratory: Laboratory) {
    const result = await LaboratoryApi.update(id, laboratory)
    LaboratoryService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await LaboratoryApi.destroyOne(id)
    LaboratoryService.loadedAll = false
    return result
  }
}