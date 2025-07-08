import type { ICD } from '../../../modules/icd'
import type { BaseIndexedDB } from '../_base/_base.indexed-db'
import { BaseRepository } from '../_base/_base.repository'
import { MeaDatabase } from '../database'

export class ICDRepository extends BaseRepository<ICD> {
  constructor(baseDB: BaseIndexedDB) {
    super({ baseDB, storeName: 'ICD' })
  }
}

export const ICDDB = new ICDRepository(MeaDatabase)
