import { BaseIndexedDB } from './_base/_base.indexed-db'

export const MeaDatabase = new BaseIndexedDB({
  databaseName: 'MeaDatabase',
  version: 1,
  collections: [
    { storeName: 'Customers', keyPath: 'id' },
    { storeName: 'Distributors', keyPath: 'id' },
    { storeName: 'Products', keyPath: 'id' },
    { storeName: 'RefreshTimes', keyPath: 'code' },
  ],
})
