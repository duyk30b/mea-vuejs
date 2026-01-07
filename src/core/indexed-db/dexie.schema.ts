import type { Address } from '@/modules/address'
import type { Batch } from '@/modules/batch'
import type { Customer } from '@/modules/customer'
import type { ICD } from '@/modules/icd'
import type { Product } from '@/modules/product'
import Dexie, { type Table } from 'dexie'

export type RefreshTimeCode = 'ADDRESS' | 'ICD' | 'PRODUCT' | 'BATCH' | 'CUSTOMER'

export type RefreshTime = {
  code: RefreshTimeCode
  dataVersion: number
  time: string
}

export class BaseDexieDB extends Dexie {
  ICD!: Table<ICD, number>
  Address!: Table<Address, number>
  Customer!: Table<Customer, number>
  Product!: Table<Product, number>
  Batch!: Table<Batch, number>
  RefreshTime!: Table<RefreshTime, number>

  constructor() {
    super('AppDatabase')

    this.version(1).stores({
      ICD: 'id, code',
      Address: 'id',
      Customer: 'id, customerCode, phone, fullName, debt',
      Product: 'id, productCode, brandName, substance',
      Batch: 'id, productId',
      RefreshTime: 'code',
    })
  }
}

export const DexieDB = new BaseDexieDB()
