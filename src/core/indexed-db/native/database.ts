import { BaseIndexedDB } from './_base.indexed-db'

export const MeaDatabase = new BaseIndexedDB({
  databaseName: 'MeaDatabase',
  version: 1,
  collections: [
    { storeName: 'ICD', keyPath: 'id' },
    { storeName: 'Address', keyPath: 'id' },
    { storeName: 'Customer', keyPath: 'id' },
    { storeName: 'Product', keyPath: 'id' },
    { storeName: 'Batch', keyPath: 'id' },
    { storeName: 'RefreshTime', keyPath: 'code' },
  ],
})
