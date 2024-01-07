import { BaseCondition, type ConditionType } from './_base.condition'
import type { BaseIndexedDB } from './_base.indexed-db'

export class BaseRepository<T> extends BaseCondition<T> {
  public storeName: string
  public baseDB: BaseIndexedDB

  constructor(options: { baseDB: BaseIndexedDB; storeName: string }) {
    super()
    this.baseDB = options.baseDB
    this.storeName = options.storeName
  }

  async getManyBy(condition: ConditionType<T>): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.baseDB.db!.transaction([this.storeName], 'readonly')
      const objectStore = transaction.objectStore(this.storeName)

      const request = objectStore.openCursor()
      const result: T[] = []

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          if (this.processCondition(cursor.value, condition)) {
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
  }

  async getManyByIds(ids: number[]): Promise<T[]> {
    const transaction = this.baseDB.db!.transaction([this.storeName], 'readonly')
    const objectStore = transaction.objectStore(this.storeName)

    const getPromises: Promise<T | undefined>[] = []

    for (const id of ids) {
      const getPromise = new Promise<T | undefined>((resolve, reject) => {
        const getRequest = objectStore.get(id)

        getRequest.onsuccess = (event) => {
          resolve((event.target as IDBRequest).result as T | undefined)
        }

        getRequest.onerror = (event) => {
          reject((event.target as IDBRequest).error)
        }
      })

      getPromises.push(getPromise)
    }

    const data: T[] = []
    const resultPromise = await Promise.allSettled(getPromises)
    resultPromise.forEach((i) => {
      if (i.status === 'fulfilled' && i.value) {
        data.push(i.value)
      }
    })
    return data
  }

  async getOneBy(condition: ConditionType<T>): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.baseDB.db!.transaction([this.storeName], 'readonly')
      const objectStore = transaction.objectStore(this.storeName)

      const request = objectStore.openCursor()

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          if (this.processCondition(cursor.value, condition)) {
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
  }

  async getOneById(id: number): Promise<T | undefined> {
    const transaction = this.baseDB.db!.transaction([this.storeName], 'readonly')
    const objectStore = transaction.objectStore(this.storeName)

    return new Promise((resolve, reject) => {
      const getRequest = objectStore.get(id)

      getRequest.onsuccess = (event) => {
        resolve((event.target as IDBRequest).result as T | undefined)
      }

      getRequest.onerror = (event) => {
        reject((event.target as IDBRequest).error)
      }
    })
  }

  async insertMany(data: T[]) {
    const transaction = this.baseDB.db!.transaction([this.storeName], 'readwrite')
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

    const result: { inserted: any[]; errors: { message: string }[] } = {
      inserted: [],
      errors: [],
    }
    const resultPromise = await Promise.allSettled(addPromises)
    resultPromise.forEach((i) => {
      if (i.status === 'fulfilled') {
        result.inserted.push(i.value)
      } else {
        result.errors.push({ message: i.reason })
      }
    })
    return result
  }

  async insertOne(data: T): Promise<number> {
    const transaction = this.baseDB.db!.transaction([this.storeName], 'readwrite')
    const objectStore = transaction.objectStore(this.storeName)

    return new Promise((resolve, reject) => {
      const addRequest = objectStore.add(data)

      addRequest.onsuccess = (event) => {
        resolve((event.target as IDBRequest).result as number)
      }

      addRequest.onerror = (event) => {
        reject((event.target as IDBRequest).error)
      }
    })
  }

  async updateMany(data: T[]) {
    const transaction = this.baseDB.db!.transaction([this.storeName], 'readwrite')
    const objectStore = transaction.objectStore(this.storeName)

    const updatePromises: Promise<void>[] = []

    for (const item of data) {
      const updatePromise = new Promise<void>((resolve, reject) => {
        const getRequest = objectStore.get((item as any).id)

        getRequest.onsuccess = (event) => {
          const existingData = (event.target as IDBRequest).result as T

          if (existingData) {
            const putRequest = objectStore.put(item)
            putRequest.onsuccess = () => {
              resolve()
            }
            putRequest.onerror = (event) => {
              reject((event.target as IDBRequest).error)
            }
          } else {
            reject(
              new Error(`Object with id ${(item as any).id} not found in ${this.storeName} store.`)
            )
          }
        }

        getRequest.onerror = (event) => {
          reject((event.target as IDBRequest).error)
        }
      })

      updatePromises.push(updatePromise)
    }

    const result: { updated: any[]; errors: { message: string }[] } = {
      updated: [],
      errors: [],
    }
    const resultPromise = await Promise.allSettled(updatePromises)
    resultPromise.forEach((i) => {
      if (i.status === 'fulfilled') {
        result.updated.push(i.value)
      } else {
        result.errors.push({ message: i.reason })
      }
    })
    return result
  }

  async updateOne(data: T): Promise<void> {
    const transaction = this.baseDB.db!.transaction([this.storeName], 'readwrite')
    const objectStore = transaction.objectStore(this.storeName)

    return new Promise((resolve, reject) => {
      const getRequest = objectStore.get((data as any).id)

      getRequest.onsuccess = (event) => {
        const existingData = (event.target as IDBRequest).result as T

        if (existingData) {
          const putRequest = objectStore.put(data)
          putRequest.onsuccess = () => {
            resolve((data as any).id)
          }
          putRequest.onerror = (event) => {
            reject((event.target as IDBRequest).error)
          }
        } else {
          reject(
            new Error(`Object with id ${(data as any).id} not found in ${this.storeName} store.`)
          )
        }
      }
    })
  }

  async upsertMany(data: T[]) {
    const transaction = this.baseDB.db!.transaction([this.storeName], 'readwrite')
    const objectStore = transaction.objectStore(this.storeName)

    const upsertPromises: Promise<any>[] = []

    for (const item of data) {
      const upsertPromise = new Promise<number | void>((resolve, reject) => {
        const putRequest = objectStore.put(item)
        putRequest.onsuccess = () => {
          resolve((item as any).id)
        }
        putRequest.onerror = (event) => {
          reject((event.target as IDBRequest).error)
        }
      })

      upsertPromises.push(upsertPromise)
    }

    const result: { upsert: any[]; errors: { message: string }[] } = {
      upsert: [],
      errors: [],
    }
    const resultPromise = await Promise.allSettled(upsertPromises)
    resultPromise.forEach((i) => {
      if (i.status === 'fulfilled') {
        result.upsert.push(i.value)
      } else {
        result.errors.push({ message: i.reason })
      }
    })
    return result
  }

  async upsertOne(data: T) {
    const transaction = this.baseDB.db!.transaction([this.storeName], 'readwrite')
    const objectStore = transaction.objectStore(this.storeName)

    return new Promise<void>((resolve, reject) => {
      const putRequest = objectStore.put(data)
      putRequest.onsuccess = () => {
        resolve((data as any).id)
      }
      putRequest.onerror = (event) => {
        reject((event.target as IDBRequest).error)
      }
    })
  }

  async deleteMany(ids: number[]) {
    const transaction = this.baseDB.db!.transaction([this.storeName], 'readwrite')
    const objectStore = transaction.objectStore(this.storeName)

    const deletePromises = []

    for (const id of ids) {
      const deletePromise = new Promise((resolve, reject) => {
        const deleteRequest = objectStore.delete(id)

        deleteRequest.onsuccess = () => {
          resolve(id)
        }

        deleteRequest.onerror = (event) => {
          reject((event.target as IDBRequest).error)
        }
      })

      deletePromises.push(deletePromise)
    }

    const result: { deleted: any[]; errors: { message: string }[] } = {
      deleted: [],
      errors: [],
    }
    const resultPromise = await Promise.allSettled(deletePromises)
    resultPromise.forEach((i) => {
      if (i.status === 'fulfilled') {
        result.deleted.push(i.value)
      } else {
        result.errors.push({ message: i.reason })
      }
    })
    return result
  }

  async deleteOneById(id: number) {
    const transaction = this.baseDB.db!.transaction([this.storeName], 'readwrite')
    const objectStore = transaction.objectStore(this.storeName)

    return new Promise((resolve, reject) => {
      const deleteRequest = objectStore.delete(id)

      deleteRequest.onsuccess = () => {
        resolve(id)
      }

      deleteRequest.onerror = (event) => {
        reject((event.target as IDBRequest).error)
      }
    })
  }
}
