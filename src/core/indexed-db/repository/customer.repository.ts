import type { Customer } from '../../../modules/customer'
import { customFilter } from '../../../utils'
import type { BaseIndexedDB } from '../_base/_base.indexed-db'
import { BaseRepository } from '../_base/_base.repository'
import { MeaDatabase } from '../database'

export class CustomerRepository extends BaseRepository<Customer> {
  constructor(baseDB: BaseIndexedDB) {
    super({ baseDB, storeName: 'Customer' })
  }
}

export const CustomerDB = new CustomerRepository(MeaDatabase)
