import type { Procedure } from '../../../modules/procedure'
import type { ProcedurePaginationQuery } from '../../../modules/procedure/procedure.dto'
import { customFilter } from '../../../utils'
import type { BaseIndexedDB } from '../_base/_base.indexed-db'
import { BaseRepository } from '../_base/_base.repository'
import { MeaDatabase } from '../database'

export class ProcedureRepository extends BaseRepository<Procedure> {
  constructor(baseDB: BaseIndexedDB) {
    super({ baseDB, storeName: 'Procedure' })
  }

  async pagination(params: ProcedurePaginationQuery) {
    const procedureList = await this.getManyBy({})

    const { filter, sort } = params
    const page = params.page || 1
    const limit = params.limit || 10

    const response = procedureList.filter((procedure) => {
      if (filter?.isActive != null && procedure.isActive !== filter?.isActive) {
        return false
      }
      if (filter?.group && procedure.group !== filter?.group) {
        return false
      }
      if (filter?.searchText) {
        if (!customFilter(procedure.name, filter?.searchText, 2)) {
          return false
        }
      }
      return true
    })
    response.sort((a, b) => {
      if (sort?.id) {
        if (sort?.id === 'ASC') return a.id < b.id ? -1 : 1
        if (sort?.id === 'DESC') return a.id > b.id ? -1 : 1
      }
      if (sort?.name) {
        if (sort?.name === 'ASC') return a.name < b.name ? -1 : 1
        if (sort?.name === 'DESC') return a.name > b.name ? -1 : 1
      }
      if (sort?.price) {
        if (sort?.price === 'ASC') return a.price < b.price ? -1 : 1
        if (sort?.price === 'DESC') return a.price > b.price ? -1 : 1
      }
      return a.id > b.id ? -1 : 1
    })

    const start = (page - 1) * limit
    const end = page * limit
    return {
      total: response.length,
      page: params.page,
      limit: params.limit,
      data: response.slice(start, end),
    }
  }

  async search(text: string): Promise<Procedure[]> {
    const procedureList = await this.getManyBy({})
    return procedureList.filter((item) => {
      if (!item.isActive) return false
      if (!customFilter(item.name, text, 2)) return false
      return true
    })
  }
}

export const ProcedureDB = new ProcedureRepository(MeaDatabase)
