import type { Address } from '../../../modules/address'
import type { BaseIndexedDB } from '../_base/_base.indexed-db'
import { BaseRepository } from '../_base/_base.repository'
import { MeaDatabase } from '../database'

export class AddressRepository extends BaseRepository<Address> {
  constructor(baseDB: BaseIndexedDB) {
    super({ baseDB, storeName: 'Address' })
  }
}

export const AddressDB = new AddressRepository(MeaDatabase)
