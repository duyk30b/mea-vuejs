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
  public collections: CollectionType[]

  constructor(options: { databaseName: string; version: number; collections: CollectionType[] }) {
    this.databaseName = options.databaseName
    this.version = options.version
    this.collections = options.collections
  }

  async runMigration() {
    if (!window.indexedDB) {
      alert('Vui lòng sử dụng trình duyệt Chrome mới nhất.')
      throw new Error('Trình duyệt không hỗ trợ IndexedDB')
    }
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, this.version)

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result

        this.collections.forEach(({ storeName, keyPath, index }) => {
          if (!db?.objectStoreNames.contains(storeName)) {
            const objectStore = db?.createObjectStore(storeName, { keyPath })
            if (index) {
              objectStore?.createIndex(index.indexName, index.property, { unique: index.unique })
            }
          }
        })
      }

      request.onsuccess = (event) => {
        const db = (event?.target as IDBOpenDBRequest)?.result
        db.close()
        resolve()
      }

      request.onerror = (event) => {
        reject((event?.target as any)?.error)
      }
    })
  }

  async createConnection(): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, this.version)

      request.onsuccess = (event) => {
        const db = (event?.target as IDBOpenDBRequest)?.result
        resolve(db)
      }

      request.onerror = (event) => {
        reject((event?.target as any)?.error)
      }
    })
  }

  async destroy() {
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
