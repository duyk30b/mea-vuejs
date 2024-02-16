import type { NoExtra } from '../../../utils'
import type { BaseIndexedDB } from './_base.indexed-db'
import { IndexedDBCondition, type BaseCondition } from './indexed-db.condition'

export class BaseRepository<
  _ENTITY,
  _SORT = { [P in keyof _ENTITY]?: 'ASC' | 'DESC' },
> extends IndexedDBCondition<_ENTITY> {
  public storeName: string
  public baseDB: BaseIndexedDB

  constructor(options: { baseDB: BaseIndexedDB; storeName: string }) {
    super()
    this.baseDB = options.baseDB
    this.storeName = options.storeName
  }

  async findAll(condition: BaseCondition<_ENTITY> = {}): Promise<_ENTITY[]> {
    const db = await this.baseDB.createConnection()
    try {
      const transaction = db!.transaction([this.storeName], 'readonly')
      const objectStore = transaction.objectStore(this.storeName)

      const data = await new Promise<_ENTITY[]>((resolve, reject) => {
        const request = objectStore.openCursor()
        const result: _ENTITY[] = []

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          if (cursor) {
            if (this.checkCondition(cursor.value, condition)) {
              result.push(cursor.value)
            }
            cursor.continue()
          } else {
            resolve(result)
          }
        }
        request.onerror = (event) => {
          reject((event.target as IDBRequest).error)
        }
      })
      transaction.commit()
      return data
    } catch (error) {
      console.log('🚀 ~ findAll ~ error:', error)
      throw error
    } finally {
      db.close()
    }
  }

  async pagination<S extends _SORT>(options: {
    page: number
    limit: number
    condition: BaseCondition<_ENTITY>
    sort: NoExtra<_SORT, S>
  }) {
    const { condition, sort, page, limit } = options

    const data = await this.findAll(condition)
    if (sort) {
      Object.entries(sort).forEach(([key, value]) => {
        if (!key || !value) return
        data.sort((a: any, b: any) => {
          if (value === 'ASC') return a[key] < b[key] ? -1 : 1
          if (value === 'DESC') return a[key] > b[key] ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      })
    }
    const start = (page - 1) * limit
    const end = page * limit

    return {
      total: data.length,
      page,
      limit,
      data: data.slice(start, end),
    }
  }

  async findMany<S extends _SORT>(options: {
    condition: BaseCondition<_ENTITY>
    limit?: number
    sort?: NoExtra<_SORT, S>
  }): Promise<_ENTITY[]> {
    const { condition, limit, sort } = options
    const data = await this.findAll(condition)
    if (sort) {
      Object.entries(sort).forEach(([key, value]) => {
        if (!key || !value) return
        data.sort((a: any, b: any) => {
          if (value === 'ASC') return a[key] < b[key] ? -1 : 1
          if (value === 'DESC') return a[key] > b[key] ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      })
    }
    if (limit) return data.slice(0, limit)

    return data
  }

  async findManyBy(condition: BaseCondition<_ENTITY>): Promise<_ENTITY[]> {
    const data = await this.findAll(condition)
    return data
  }

  async findManyByKeys(keys: number[] | string[]): Promise<_ENTITY[]> {
    const db = await this.baseDB.createConnection()

    try {
      const transaction = db.transaction([this.storeName], 'readonly')
      const objectStore = transaction.objectStore(this.storeName)

      const getPromises: Promise<_ENTITY | undefined>[] = []

      for (const key of keys) {
        const getPromise = new Promise<_ENTITY | undefined>((resolve, reject) => {
          const getRequest = objectStore.get(key)

          getRequest.onsuccess = (event) => {
            resolve((event.target as IDBRequest).result as _ENTITY | undefined)
          }

          getRequest.onerror = (event) => {
            reject((event.target as IDBRequest).error)
          }
        })

        getPromises.push(getPromise)
      }

      const data: _ENTITY[] = []
      const resultPromise = await Promise.allSettled(getPromises)
      resultPromise.forEach((i) => {
        if (i.status === 'fulfilled' && i.value) {
          data.push(i.value)
        }
      })
      transaction.commit()
      return data
    } catch (error) {
      console.log('🚀 ~ findManyByKeys ~ error:', error)
      throw error
    } finally {
      db.close()
    }
  }

  async findOneBy(condition: BaseCondition<_ENTITY>): Promise<_ENTITY | null> {
    const db = await this.baseDB.createConnection()

    try {
      const transaction = db!.transaction([this.storeName], 'readonly')
      const objectStore = transaction.objectStore(this.storeName)

      const data = await new Promise<_ENTITY | null>((resolve, reject) => {
        const request = objectStore.openCursor()
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          if (cursor) {
            if (this.checkCondition(cursor.value, condition)) {
              resolve(cursor.value)
            }
            cursor.continue()
          } else {
            resolve(null)
          }
        }

        request.onerror = (event) => {
          reject((event.target as IDBRequest).error)
        }
      })

      transaction.commit()
      return data
    } catch (error) {
      console.log('🚀 ~ findOneBy ~ error:', error)
      throw error
    } finally {
      db.close()
    }
  }

  async findOneByKey(key: number | string): Promise<_ENTITY | undefined> {
    const db = await this.baseDB.createConnection()

    try {
      const transaction = db!.transaction([this.storeName], 'readonly')
      const objectStore = transaction.objectStore(this.storeName)

      const data = await new Promise<_ENTITY | undefined>((resolve, reject) => {
        const getRequest = objectStore.get(key)

        getRequest.onsuccess = (event) => {
          const data = (event.target as IDBRequest).result
          resolve(data as _ENTITY | undefined)
        }

        getRequest.onerror = (event) => {
          reject((event.target as IDBRequest).error)
        }
      })

      transaction.commit()
      return data
    } catch (error) {
      console.log('🚀 ~ replaceOne ~ error:', error)
      throw error
    } finally {
      db.close()
    }
  }

  async insertMany(data: _ENTITY[]) {
    const result: any[] = []
    const errors: any[] = []

    const db = await this.baseDB.createConnection()

    try {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.storeName)

      const addPromises: Promise<number>[] = []

      for (const item of data) {
        const addPromise = new Promise<number>((resolve, reject) => {
          const addRequest = objectStore.add(item)

          addRequest.onsuccess = (event) => {
            resolve((event.target as IDBRequest).result as number)
          }

          addRequest.onerror = (event) => {
            reject((event.target as IDBRequest).error)
          }
        })

        addPromises.push(addPromise)
      }

      const resultPromise = await Promise.allSettled(addPromises)
      resultPromise.forEach((i) => {
        if (i.status === 'fulfilled') {
          result.push(i.value)
        } else {
          errors.push(i.reason)
        }
      })

      transaction.commit()
      if (errors.length) {
        throw new Error('Some Record upsert failed !!! ' + JSON.stringify(errors.toString))
      }
      return result
    } catch (error) {
      console.log('🚀 ~ replaceOne ~ error:', error)
      throw error
    } finally {
      db.close()
    }
  }

  async insertOne(data: _ENTITY): Promise<number> {
    const db = await this.baseDB.createConnection()

    try {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.storeName)

      const result = await new Promise<number>((resolve, reject) => {
        const addRequest = objectStore.add(data)

        addRequest.onsuccess = (event) => {
          resolve((event.target as IDBRequest).result as number)
        }

        addRequest.onerror = (event) => {
          reject((event.target as IDBRequest).error)
        }
      })
      transaction.commit()
      return result
    } catch (error) {
      console.log('🚀 ~ insertOne ~ error:', error)
      throw error
    } finally {
      db.close()
    }
  }

  async replaceMany(data: { key: string | number; item: _ENTITY }[]) {
    const result: any[] = []
    const errors: any[] = []

    const db = await this.baseDB.createConnection()

    try {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.storeName)

      const updatePromises: Promise<any>[] = []

      for (const { key, item } of data) {
        const updatePromise = new Promise<void>((resolve, reject) => {
          const getRequest = objectStore.get(key)

          getRequest.onsuccess = (event) => {
            const existingData = (event.target as IDBRequest).result as _ENTITY

            if (existingData) {
              const putRequest = objectStore.put(item)
              putRequest.onsuccess = () => {
                resolve()
              }
              putRequest.onerror = (event) => {
                reject((event.target as IDBRequest).error)
              }
            } else {
              reject(new Error(`Object with key ${key} not found in ${this.storeName} store.`))
            }
          }

          getRequest.onerror = (event) => {
            reject((event.target as IDBRequest).error)
          }
        })

        updatePromises.push(updatePromise)
      }

      const resultPromise = await Promise.allSettled(updatePromises)
      resultPromise.forEach((i) => {
        if (i.status === 'fulfilled') {
          result.push(i.value)
        } else {
          errors.push(i.reason)
        }
      })

      transaction.commit()
      if (errors.length) {
        throw new Error('Some Record upsert failed !!! ' + JSON.stringify(errors.toString))
      }
      return result
    } catch (error) {
      console.log('🚀 ~ upsertMany ~ error:', error)
      throw error
    } finally {
      db.close()
    }
  }

  async replaceOne(key: string | number, data: _ENTITY) {
    const db = await this.baseDB.createConnection()
    try {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.storeName)

      const result = await new Promise((resolve, reject) => {
        const getRequest = objectStore.get(key)

        getRequest.onsuccess = (event) => {
          const existingData = (event.target as IDBRequest).result as _ENTITY

          if (existingData) {
            const putRequest = objectStore.put(data)
            putRequest.onsuccess = () => {
              resolve(key)
            }
            putRequest.onerror = (event) => {
              reject((event.target as IDBRequest).error)
            }
          } else {
            reject(new Error(`Object with key ${key} not found in ${this.storeName} store.`))
          }
        }
      })
      transaction.commit()
      return result
    } catch (error) {
      console.log('🚀 ~ replaceOne ~ error:', error)
      throw error
    } finally {
      db.close()
    }
  }

  async upsertMany(data: _ENTITY[]) {
    const result: any[] = []
    const errors: any[] = []

    const db = await this.baseDB.createConnection()
    try {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.storeName)
      const key = Array.isArray(objectStore.keyPath) ? objectStore.keyPath[0] : objectStore.keyPath

      const upsertPromises: Promise<any>[] = []

      for (const item of data) {
        const upsertPromise = new Promise<any>((resolve, reject) => {
          const putRequest = objectStore.put(item)
          putRequest.onsuccess = () => {
            resolve((item as any)[key])
          }
          putRequest.onerror = (event) => {
            reject((event.target as IDBRequest).error)
          }
        })

        upsertPromises.push(upsertPromise)
      }

      const resultPromise = await Promise.allSettled(upsertPromises)
      resultPromise.forEach((i) => {
        if (i.status === 'fulfilled') {
          result.push(i.value)
        } else {
          errors.push(i.reason)
        }
      })
      transaction.commit()
      if (errors.length) {
        throw new Error('Some Record upsert failed !!! ' + JSON.stringify(errors.toString))
      }
      return result
    } catch (error) {
      console.log('🚀 ~ upsertMany ~ error:', error)
      throw error
    } finally {
      db.close()
    }
  }

  async upsertOne(data: _ENTITY): Promise<string | number> {
    const db = await this.baseDB.createConnection()

    try {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.storeName)
      const key = Array.isArray(objectStore.keyPath) ? objectStore.keyPath[0] : objectStore.keyPath

      const result = await new Promise<string | number>((resolve, reject) => {
        const putRequest = objectStore.put(data)
        putRequest.onsuccess = () => {
          resolve(key)
        }
        putRequest.onerror = (event) => {
          reject((event.target as IDBRequest).error)
        }
      })

      transaction.commit()
      return result
    } catch (error) {
      console.log('🚀 ~ upsertMany ~ error:', error)
      throw error
    } finally {
      db.close()
    }
  }

  async deleteMany(keys: number[]) {
    const result: any[] = []
    const errors: any[] = []

    const db = await this.baseDB.createConnection()
    try {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.storeName)

      const deletePromises = []

      for (const key of keys) {
        const deletePromise = new Promise((resolve, reject) => {
          const deleteRequest = objectStore.delete(key)

          deleteRequest.onsuccess = () => {
            resolve(key)
          }

          deleteRequest.onerror = (event) => {
            reject((event.target as IDBRequest).error)
          }
        })

        deletePromises.push(deletePromise)
      }

      const resultPromise = await Promise.allSettled(deletePromises)
      resultPromise.forEach((i) => {
        if (i.status === 'fulfilled') {
          result.push(i.value)
        } else {
          errors.push(i.reason)
        }
      })

      transaction.commit()
      if (errors.length) {
        throw new Error('Some Record upsert failed !!! ' + JSON.stringify(errors.toString))
      }
      return result
    } catch (error) {
      console.log('🚀 ~ upsertMany ~ error:', error)
      throw error
    } finally {
      db.close()
    }
  }

  async deleteOneByKey(key: number) {
    const db = await this.baseDB.createConnection()

    try {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.storeName)

      const result = await new Promise((resolve, reject) => {
        const deleteRequest = objectStore.delete(key)

        deleteRequest.onsuccess = () => {
          resolve(key)
        }

        deleteRequest.onerror = (event) => {
          reject((event.target as IDBRequest).error)
        }
      })

      transaction.commit()
      return result
    } catch (error) {
      console.log('🚀 ~ upsertMany ~ error:', error)
      throw error
    } finally {
      db.close()
    }
  }
}
