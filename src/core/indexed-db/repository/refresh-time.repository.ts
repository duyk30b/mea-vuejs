import type { BaseIndexedDB } from '../_base/_base.indexed-db'
import { BaseRepository } from '../_base/_base.repository'
import { MeaDatabase } from '../database'

export type RefreshTimeCode = 'PROCEDURE' | 'PRODUCT' | 'BATCH' | 'CUSTOMER' | 'DISTRIBUTOR'

export type RefreshTime = {
  code: RefreshTimeCode
  time: string
}

export class RefreshTimeRepository extends BaseRepository<RefreshTime> {
  constructor(baseDB: BaseIndexedDB) {
    super({ baseDB, storeName: 'RefreshTime' })
  }

  async findOneByCode(code: RefreshTimeCode) {
    return await this.findOneByKey(code)
  }
}

export const RefreshTimeDB = new RefreshTimeRepository(MeaDatabase)
