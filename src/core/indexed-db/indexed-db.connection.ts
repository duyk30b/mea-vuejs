import Dexie from 'dexie'

export type RefreshTimeCode = 'ADDRESS' | 'ICD' | 'PRODUCT' | 'BATCH' | 'CUSTOMER'

export class RefreshTime {
  code: RefreshTimeCode
  dataVersion: number
  time: string
}

class IndexedDBConnection {
  static db: Dexie

  static init() {
    if (!this.db) {
      this.db = new Dexie('MeaDatabase')
      this.db.version(2).stores({
        ICD: 'id, code',
        Address: 'id',
        Customer: 'id, customerCode, phone, fullName, debt',
        Product: 'id, productCode, brandName, substance',
        Batch: 'id, productId',
        RefreshTime: 'code',
      })
    }

    return this.db
  }

  static async clear() {
    await this.db?.delete()
    this.db = null as any
    this.init()
  }
}

export { IndexedDBConnection }
