import { Storage, StorageKey, StorageKeyReturnType } from '@airgap/beacon-types'
import { Logger } from '@airgap/beacon-core'

const logger = new Logger('IndexedDBStorage')

export class IndexedDBStorage extends Storage {
  constructor(
    private readonly dbName: string = 'WALLET_CONNECT_V2_INDEXED_DB',
    private readonly storeName: string = 'keyvaluestorage'
  ) {
    super()
    this.init()
  }

  private async init() {
    const request = indexedDB.open(this.dbName)

    request.onupgradeneeded = (event: any) => {
      const db = event.target?.result

      if (!db.objectStoreNames.contains(this.storeName)) {
        db.createObjectStore(this.storeName)
      }
    }

    request.onsuccess = (event: any) => {
      logger.log(`Database ${this.dbName} and store ${this.dbName} are ready for use.`)
      const db = event.target?.result

      db.close()
    }

    request.onerror = (event: any) => {
      logger.error(`Error opening database ${this.dbName}:`, event.target?.error)
    }
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

  /**
   * @returns all stored values
   */
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

  /**
   * @returns all stored keys in store
   */
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

  /**
   * @returns clears all stored entries in store
   */
  clearStore(): Promise<void> {
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
  /**
   * it copies over all key value pairs from a source store into a target one
   * @param targetDBName the name of the target DB
   * @param targetStoreName the name of the target store
   * @param skipKeys all the keys to ignore
   */
  populateStore(
    targetDBName: string,
    targetStoreName: string,
    skipKeys: string[] = []
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Open the source database
      const openRequest = indexedDB.open(this.dbName)

      openRequest.onsuccess = (e: Event) => {
        const db = (e.target as IDBOpenDBRequest).result
        if (!db) {
          reject(new Error('Failed to open source database.'))
          return
        }

        const transaction = db.transaction(this.storeName, 'readonly')
        const store = transaction.objectStore(this.storeName)

        // Get all keys and values from the source store
        const allRecordsRequest = store.getAll()
        const allKeysRequest = store.getAllKeys()

        allRecordsRequest.onsuccess = () => {
          allKeysRequest.onsuccess = () => {
            const records = allRecordsRequest.result
            const keys = allKeysRequest.result

            // Open the target database
            const targetDBRequest = indexedDB.open(targetDBName)

            targetDBRequest.onupgradeneeded = (event: any) => {
              const db = event.target?.result

              if (!db.objectStoreNames.contains(targetStoreName)) {
                db.createObjectStore(targetStoreName)
              }
            }

            targetDBRequest.onsuccess = (e: Event) => {
              const targetDB = (e.target as IDBOpenDBRequest).result
              const targetTransaction = targetDB.transaction(targetStoreName, 'readwrite')
              const targetStore = targetTransaction.objectStore(targetStoreName)

              // Copy each key-value pair to the target store
              keys
                .filter((key) => !skipKeys.includes(key.toString()))
                .forEach((key, index) => {
                  targetStore.put(records[index], key)
                })

              targetTransaction.oncomplete = () => {
                logger.log(
                  `Key-value pairs copied to ${targetStoreName} in ${targetDBName} successfully.`
                )
                resolve()
              }

              targetTransaction.onerror = () => {
                reject(new Error('Error copying key-value pairs to the new database.'))
              }
            }

            targetDBRequest.onerror = () => {
              reject(new Error('Error opening target database.'))
            }
          }
        }
      }

      openRequest.onerror = () => {
        reject(new Error('Error opening source database.'))
      }
    })
  }
}
