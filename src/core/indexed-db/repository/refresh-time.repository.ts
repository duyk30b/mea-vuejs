import type { BaseIndexedDB } from '../_base/_base.indexed-db'
import { BaseRepository } from '../_base/_base.repository'
import { MeaDatabase } from '../database'

export type RefreshTimeCode = 'PRODUCT' | 'CUSTOMER' | 'DISTRIBUTOR'

export type RefreshTime = {
  code: RefreshTimeCode
  time: string
}

export class RefreshTimeRepository extends BaseRepository<RefreshTime> {
  constructor(baseDB: BaseIndexedDB) {
    super({ baseDB, storeName: 'RefreshTimes' })
  }

  getOneByCode(code: RefreshTimeCode) {
    return this.getOneBy({ code })
  }
}

export const RefreshTimeDB = new RefreshTimeRepository(MeaDatabase)
