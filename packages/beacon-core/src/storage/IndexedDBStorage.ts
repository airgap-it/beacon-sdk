import { Storage, StorageKey, StorageKeyReturnType } from '@airgap/beacon-types'
import { Logger } from '@airgap/beacon-core'

const logger = new Logger('IndexedDBStorage')

export class IndexedDBStorage extends Storage {
  private db: IDBDatabase | null = null

  constructor(
    private readonly dbName: string = 'WALLET_CONNECT_V2_INDEXED_DB',
    private readonly storeName: string = 'keyvaluestorage'
  ) {
    super()
  }

  static async doesDatabaseAndTableExist(): Promise<boolean> {
    const targetDatabaseName = 'WALLET_CONNECT_V2_INDEXED_DB'
    const targetTableName = 'keyvaluestorage'

    const databases = await indexedDB.databases()

    if (!databases.some((database) => database.name === targetDatabaseName)) {
      return false // The specified database doesn't exist
    }

    // Open the database to check if the table exists
    return new Promise<boolean>((resolve, reject) => {
      const request = indexedDB.open(targetDatabaseName)

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (db.objectStoreNames.contains(targetTableName)) {
          // The table exists in the database
          resolve(true)
        } else {
          // The table doesn't exist in the database
          resolve(false)
        }

        db.close()
      }

      request.onerror = (event) => {
        console.error('Error opening database:', (event.target as IDBRequest).error)
        reject(false) // Assume the table doesn't exist if there's an error opening the database
      }
    })
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

  getAll(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName)

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        const transaction = db.transaction(this.storeName, 'readonly')
        const objectStore = transaction.objectStore(this.storeName)

        const getAllRequest = objectStore.getAll()

        getAllRequest.onsuccess = () => {
          const results = getAllRequest.result
          resolve(results)
        }

        getAllRequest.onerror = (getAllEvent) => {
          logger.error(`Error getting all records:`, getAllEvent.target)
          reject(getAllEvent.target)
        }
      }

      request.onerror = (event) => {
        logger.error('Error opening database:', event.target)
        reject(event.target)
      }
    })
  }

  getAllKeys(): Promise<IDBValidKey[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName)

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        const transaction = db.transaction(this.storeName, 'readonly')
        const objectStore = transaction.objectStore(this.storeName)

        const getAllRequest = objectStore.getAllKeys()

        getAllRequest.onsuccess = () => {
          const results = getAllRequest.result
          resolve(results)
        }

        getAllRequest.onerror = (getAllEvent) => {
          logger.error(`Error getting all records:`, getAllEvent.target)
          reject(getAllEvent.target)
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
