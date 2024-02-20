import { Storage, StorageKey, StorageKeyReturnType } from '@airgap/beacon-types'
import { Logger } from '@airgap/beacon-core'

const logger = new Logger('IndexedDBStorage')

export class IndexedDBStorage extends Storage {
  private readonly dbName: string = 'WALLET_CONNECT_V2_INDEXED_DB'
  private readonly storeName: string = 'keyvaluestorage'
  private db: IDBDatabase | null = null

  constructor() {
    super()
    this.init()
  }

  private async init() {
    const request = indexedDB.open(this.dbName)

    request.onupgradeneeded = (event: any) => {
      const db = event.target?.result

      // Create the object store if it doesn't exist
      if (!db.objectStoreNames.contains(this.storeName)) {
        db.createObjectStore(this.storeName)
      }
    }

    request.onsuccess = (event: any) => {
      console.log(`Database ${this.dbName} and store ${this.dbName} are ready for use.`)
      const db = event.target?.result

      // Use the database and object store here
      // ...

      db.close()
    }

    request.onerror = (event: any) => {
      console.error(`Error opening database ${this.dbName}:`, event.target?.error)
    }
  }

  openDatabase(): Promise<string> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)

      request.onupgradeneeded = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result

        // Create object store if it doesn't exist
        if (this.db && !this.db.objectStoreNames.contains(this.storeName)) {
          this.db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true })
        }
      }

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result
        resolve('Database opened successfully')
      }

      request.onerror = (event) => {
        reject(`Error opening database: ${(event.target as IDBOpenDBRequest).error}`)
      }
    })
  }

  get<K extends StorageKey>(key: K): Promise<StorageKeyReturnType[K]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName)

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        const transaction = db.transaction(this.storeName, 'readonly')
        const objectStore = transaction.objectStore(this.storeName)

        const getRequest = objectStore.get(key)

        getRequest.onsuccess = () => {
          const result = getRequest.result
          resolve(result)
        }

        getRequest.onerror = (getEvent) => {
          logger.error(`Error getting record with key ${key}:`, getEvent.target)
          reject(getEvent.target)
        }
      }

      request.onerror = (event) => {
        logger.error('Error opening database:', event.target)
        reject(event.target)
      }
    })
  }

  set<K extends StorageKey>(key: K, value: StorageKeyReturnType[K]): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName)

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        const transaction = db.transaction(this.storeName, 'readwrite')
        const objectStore = transaction.objectStore(this.storeName)

        const putRequest = objectStore.put(value, key)

        putRequest.onsuccess = () => {
          logger.log(`Record with key ${key} updated/inserted successfully`)
          resolve()
        }

        putRequest.onerror = (putEvent) => {
          logger.error(`Error updating/inserting record with key ${key}:`, putEvent.target)
          reject(putEvent.target)
        }
      }

      request.onerror = (event) => {
        logger.error('Error opening database:', event.target)
        reject(event.target)
      }
    })
  }

  delete<K extends StorageKey>(key: K): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName)

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        const transaction = db.transaction(this.storeName, 'readwrite')
        const objectStore = transaction.objectStore(this.storeName)

        const deleteRequest = objectStore.delete(key)

        deleteRequest.onsuccess = () => {
          logger.log(`Record with key ${key} deleted successfully`)
          resolve()
        }

        deleteRequest.onerror = (deleteEvent: Event) => {
          logger.error(
            `Error deleting record with key ${key}:`,
            (deleteEvent.target as IDBRequest).error
          )
          reject((deleteEvent.target as IDBRequest).error)
        }
      }

      request.onerror = (event: Event) => {
        logger.error('Error opening database:', (event.target as IDBRequest).error)
        reject((event.target as IDBRequest).error)
      }
    })
  }

  subscribeToStorageChanged(
    callback: (arg: {
      eventType: 'storageCleared' | 'entryModified'
      key: string | null
      oldValue: string | null
      newValue: string | null
    }) => {}
  ): Promise<void> {
    logger.debug('subscriveToStorageEvent', callback)
    throw new Error('Method not implemented.')
  }

  getPrefixedKey<K extends StorageKey>(key: K): string {
    logger.debug('getPrefixedKey', key)
    throw new Error('Method not implemented.')
  }

  clearTable(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName)

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = db.transaction(this.storeName, 'readwrite')
        const objectStore = transaction.objectStore(this.storeName)

        const clearRequest = objectStore.clear()

        clearRequest.onsuccess = () => {
          logger.log(`All entries in ${this.storeName} cleared successfully`)
          resolve()
        }

        clearRequest.onerror = (clearEvent) => {
          logger.error(`Error clearing entries in ${this.storeName}:`, clearEvent.target)
          reject(clearEvent.target)
        }
      }

      request.onerror = (event) => {
        logger.error('Error opening database:', event.target)
        reject(event.target)
      }
    })
  }
}
