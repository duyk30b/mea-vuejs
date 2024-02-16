import type { Distributor } from '../../../modules/distributor'
import type { BaseIndexedDB } from '../_base/_base.indexed-db'
import { BaseRepository } from '../_base/_base.repository'
import { MeaDatabase } from '../database'

export class DistributorRepository extends BaseRepository<Distributor> {
  constructor(baseDB: BaseIndexedDB) {
    super({ baseDB, storeName: 'Distributor' })
  }
}

export const DistributorDB = new DistributorRepository(MeaDatabase)
