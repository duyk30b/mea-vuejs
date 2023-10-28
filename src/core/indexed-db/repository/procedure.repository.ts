import type { Procedure } from '../../../modules/procedure'
import type { BaseIndexedDB } from '../_base/_base.indexed-db'
import { BaseRepository } from '../_base/_base.repository'
import { MeaDatabase } from '../database'

export class ProcedureRepository extends BaseRepository<Procedure> {
  constructor(baseDB: BaseIndexedDB) {
    super({ baseDB, storeName: 'Procedure' })
  }
}

export const ProcedureDB = new ProcedureRepository(MeaDatabase)
