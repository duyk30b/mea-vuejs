import { Address } from '@/modules/address'
import { Batch } from '@/modules/batch'
import { Customer } from '@/modules/customer'
import { ICD } from '@/modules/icd'
import { Product } from '@/modules/product'
import { BaseDexieRepository } from './dexie/_base_dexie.repository'
import { IndexedDBConnection, RefreshTime } from './indexed-db.connection'

export const RefreshTimeDB = new BaseDexieRepository<RefreshTime>(
  IndexedDBConnection,
  'RefreshTime',
)

export const AddressDB = new BaseDexieRepository<Address>(IndexedDBConnection, 'Address')
export const ICDDB = new BaseDexieRepository<ICD>(IndexedDBConnection, 'ICD')

export const CustomerDB = new BaseDexieRepository<Customer>(IndexedDBConnection, 'Customer')
export const ProductDB = new BaseDexieRepository<Product>(IndexedDBConnection, 'Product')
export const BatchDB = new BaseDexieRepository<Batch>(IndexedDBConnection, 'Batch')
