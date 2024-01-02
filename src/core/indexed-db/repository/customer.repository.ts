import type { Customer } from '../../../modules/customer'
import type { CustomerPaginationQuery } from '../../../modules/customer/customer.dto'
import { customFilter } from '../../../utils'
import type { BaseIndexedDB } from '../_base/_base.indexed-db'
import { BaseRepository } from '../_base/_base.repository'
import { MeaDatabase } from '../database'

export class CustomerRepository extends BaseRepository<Customer> {
  constructor(baseDB: BaseIndexedDB) {
    super({ baseDB, storeName: 'Customers' })
  }

  async pagination(params: CustomerPaginationQuery) {
    const customerList = await this.getManyBy({})

    const { filter, sort } = params
    const page = params.page || 1
    const limit = params.limit || 10
    const response = customerList.filter((customer) => {
      if (filter?.isActive != null && customer.isActive !== filter?.isActive) {
        return false
      }
      if (filter?.searchText) {
        if (
          !customFilter(customer.fullName, filter?.searchText, 2) &&
          !customFilter(customer.phone || '', filter?.searchText, 2)
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

  async search(text: string): Promise<Customer[]> {
    const customerList = await this.getManyBy({})
    return customerList.filter((item) => {
      if (!item.isActive) return false
      if (!customFilter(item.fullName, text, 2) && !customFilter(item.phone || '', text, 2)) {
        return false
      }
      return true
    })
  }
}

export const CustomerDB = new CustomerRepository(MeaDatabase)
