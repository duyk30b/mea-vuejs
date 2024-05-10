import { BaseIndexedDB } from './_base/_base.indexed-db'

export const MeaDatabase = new BaseIndexedDB({
  databaseName: 'MeaDatabase',
  version: 1,
  collections: [
    { storeName: 'Customer', keyPath: 'id' },
    { storeName: 'Distributor', keyPath: 'id' },
    { storeName: 'Product', keyPath: 'id' },
    { storeName: 'Batch', keyPath: 'id' },
    { storeName: 'Procedure', keyPath: 'id' },
    { storeName: 'RefreshTime', keyPath: 'code' },
  ],
})
