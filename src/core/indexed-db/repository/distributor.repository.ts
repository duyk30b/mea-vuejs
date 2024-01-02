import type { Distributor } from '../../../modules/distributor'
import type { DistributorPaginationQuery } from '../../../modules/distributor/distributor.dto'
import { customFilter } from '../../../utils'
import type { BaseIndexedDB } from '../_base/_base.indexed-db'
import { BaseRepository } from '../_base/_base.repository'
import { MeaDatabase } from '../database'

export class DistributorRepository extends BaseRepository<Distributor> {
  constructor(baseDB: BaseIndexedDB) {
    super({ baseDB, storeName: 'Distributors' })
  }

  async pagination(params: DistributorPaginationQuery) {
    const distributorList = await this.getManyBy({})

    const { filter, sort } = params
    const page = params.page || 1
    const limit = params.limit || 10
    const response = distributorList.filter((distributor) => {
      if (filter?.isActive != null && distributor.isActive !== filter?.isActive) {
        return false
      }
      if (filter?.searchText) {
        if (
          !customFilter(distributor.fullName, filter?.searchText, 2) &&
          !customFilter(distributor.phone || '', filter?.searchText, 2)
        ) {
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
      if (sort?.debt) {
        if (sort?.debt === 'ASC') return a.debt < b.debt ? -1 : 1
        if (sort?.debt === 'DESC') return a.debt > b.debt ? -1 : 1
      }
      if (sort?.fullName) {
        if (sort?.fullName === 'ASC') return a.fullName < b.fullName ? -1 : 1
        if (sort?.fullName === 'DESC') return a.fullName > b.fullName ? -1 : 1
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

  async search(text: string): Promise<Distributor[]> {
    const distributorList = await this.getManyBy({})
    return distributorList.filter((item) => {
      if (!item.isActive) return false
      if (!customFilter(item.fullName, text, 2) && !customFilter(item.phone || '', text, 2)) {
        return false
      }
      return true
    })
  }
}

export const DistributorDB = new DistributorRepository(MeaDatabase)
