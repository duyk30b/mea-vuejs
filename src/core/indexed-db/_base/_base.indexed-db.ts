export type CollectionType = {
  storeName: string
  keyPath: string
  index?: {
    indexName: string
    property: string | Iterable<string>
    unique: boolean
  }
}

export class BaseIndexedDB {
  public databaseName: string
  public version: number
  public db: IDBDatabase | null
  public collections: CollectionType[]

  constructor(options: { databaseName: string; version: number; collections: CollectionType[] }) {
    this.db = null
    this.databaseName = options.databaseName
    this.version = options.version
    this.collections = options.collections
  }

  async openConnection() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, this.version)

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result

        this.collections.forEach(({ storeName, keyPath, index }) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const objectStore = db.createObjectStore(storeName, { keyPath })
            if (index) {
              objectStore.createIndex(index.indexName, index.property, { unique: index.unique })
            }
          }
        })
      }

      request.onsuccess = (event) => {
        this.db = (event?.target as any)?.result
        resolve()
      }

      request.onerror = (event) => {
        reject((event?.target as any)?.error)
      }
    })
  }

  public closeConnection() {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  async destroy() {
    this.closeConnection()
    return new Promise<void>((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(this.databaseName)
      deleteRequest.onsuccess = function (event) {
        resolve()
      }
      deleteRequest.onerror = function (event) {
        reject((event.target as IDBRequest).error)
      }
      deleteRequest.onblocked = function (event) {
        console.error('Database delete blocked. Close other connections and try again.')
      }
    })
  }
}
