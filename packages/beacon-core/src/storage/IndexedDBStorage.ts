import { Storage, StorageKey, StorageKeyReturnType } from '@airgap/beacon-types'
import { Logger } from '../utils/Logger'

const logger = new Logger('IndexedDBStorage')

export class IndexedDBStorage extends Storage {
  private db: IDBDatabase | null = null
  private isSupported: boolean = true

  /**
   * @param dbName Name of the database.
   * @param storeNames An array of object store names to create in the database.
   *                   The first store in the array will be used as the default if none is specified.
   */
  constructor(
    private readonly dbName: string = 'WALLET_CONNECT_V2_INDEXED_DB',
    private readonly storeNames: string[] = ['keyvaluestorage']
  ) {
    super()
    this.initDB()
      .then((db) => (this.db = db))
      .catch((err) => logger.error(err.message))
  }

  private isIndexedDBSupported() {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      logger.log('isIndexedDBSupported', 'IndexedDB is supported in this browser.')
      return true
    } else {
      logger.error('isIndexedDBSupported', 'IndexedDB is not supported in this browser.')
      return false
    }
  }

  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      this.isSupported = this.isIndexedDBSupported()
      if (!this.isSupported) {
        reject('IndexedDB is not supported.')
        return
      }

      const openRequest = indexedDB.open(this.dbName)

      openRequest.onupgradeneeded = () => {
        const db = openRequest.result
        // Create all required object stores
        this.storeNames.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName)
          }
        })
      }

      openRequest.onsuccess = (event: any) => {
        const db = event.target.result as IDBDatabase
        // Check if all stores exist – if not, perform an upgrade.
        const missingStores = this.storeNames.filter(
          (storeName) => !db.objectStoreNames.contains(storeName)
        )
        if (missingStores.length > 0) {
          db.close()
          const newVersion = db.version + 1
          const upgradeRequest = indexedDB.open(this.dbName, newVersion)

          upgradeRequest.onupgradeneeded = () => {
            const upgradedDB = upgradeRequest.result
            missingStores.forEach((storeName) => {
              if (!upgradedDB.objectStoreNames.contains(storeName)) {
                upgradedDB.createObjectStore(storeName)
              }
            })
          }

          upgradeRequest.onsuccess = (event: any) => {
            this.db = event.target.result as IDBDatabase
            resolve(this.db)
          }

          upgradeRequest.onerror = (event: any) => reject(event.target.error)
        } else {
          this.db = db
          resolve(db)
        }
      }

      openRequest.onerror = (event: any) => reject(event.target.error)
    })
  }

  /**
   * Performs a transaction on the given object store.
   * @param mode Transaction mode.
   * @param storeName The name of the object store.
   * @param operation The operation to perform with the object store.
   */
  private async transaction<T>(
    mode: IDBTransactionMode,
    storeName: string,
    operation: (store: IDBObjectStore) => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject('IndexedDB is not supported.')
        return
      }

      if (!this.db?.objectStoreNames.contains(storeName)) {
        reject(`${storeName} not found. error: ${new Error().stack}`)
        return
      }

      const transaction = this.db.transaction(storeName, mode)
      const objectStore = transaction.objectStore(storeName)
      operation(objectStore).then(resolve).catch(reject)
    })
  }

  /**
   * Retrieves a value by key from the specified object store.
   * If no store is specified, the default (first in the list) is used.
   */
  public get<K extends StorageKey>(key: K, storeName?: string): Promise<StorageKeyReturnType[K]>
  public get(key: string, storeName?: string): Promise<string | undefined>
  public get(key: StorageKey | string, storeName: string = this.storeNames[0]): Promise<any> {
    return this.transaction(
      'readonly',
      storeName,
      (store) =>
        new Promise((resolve, reject) => {
          const getRequest = store.get(key)
          getRequest.onsuccess = () => resolve(getRequest.result)
          getRequest.onerror = () => reject(getRequest.error)
        })
    )
  }

  /**
   * Stores a key/value pair in the specified object store.
   */
  public set<K extends StorageKey>(
    key: K,
    value: StorageKeyReturnType[K],
    storeName?: string
  ): Promise<void>
  public set(key: string, value: string, storeName?: string): Promise<void>
  public set(
    key: StorageKey | string,
    value: any,
    storeName: string = this.storeNames[0]
  ): Promise<void> {
    return this.transaction(
      'readwrite',
      storeName,
      (store) =>
        new Promise((resolve, reject) => {
          const putRequest = store.put(value, key)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        })
    )
  }

  /**
   * Deletes an entry by key from the specified object store.
   */
  public delete<K extends StorageKey>(key: K, storeName?: string): Promise<void>
  public delete(key: string, storeName?: string): Promise<void>
  public delete(key: StorageKey | string, storeName: string = this.storeNames[0]): Promise<void> {
    return this.transaction(
      'readwrite',
      storeName,
      (store) =>
        new Promise((resolve, reject) => {
          const deleteRequest = store.delete(key)
          deleteRequest.onsuccess = () => resolve()
          deleteRequest.onerror = () => reject(deleteRequest.error)
        })
    )
  }

  /**
   * Retrieves all values from the specified object store.
   */
  public getAll(storeName?: string): Promise<string[]> {
    return this.transaction(
      'readonly',
      storeName || this.storeNames[0],
      (store) =>
        new Promise((resolve, reject) => {
          const getAllRequest = store.getAll()
          getAllRequest.onsuccess = () => resolve(getAllRequest.result)
          getAllRequest.onerror = () => reject(getAllRequest.error)
        })
    )
  }

  /**
   * Retrieves all keys from the specified object store.
   */
  public getAllKeys(storeName?: string): Promise<IDBValidKey[]> {
    return this.transaction(
      'readonly',
      storeName || this.storeNames[0],
      (store) =>
        new Promise((resolve, reject) => {
          const getAllKeysRequest = store.getAllKeys()
          getAllKeysRequest.onsuccess = () => resolve(getAllKeysRequest.result)
          getAllKeysRequest.onerror = () => reject(getAllKeysRequest.error)
        })
    )
  }

  /**
   * Clears all entries from the specified object store.
   */
  public clearStore(storeName?: string): Promise<void> {
    return this.transaction(
      'readwrite',
      storeName || this.storeNames[0],
      (store) =>
        new Promise((resolve, reject) => {
          const clearRequest = store.clear()
          clearRequest.onsuccess = () => resolve()
          clearRequest.onerror = () => reject(clearRequest.error)
        })
    )
  }

  getPrefixedKey<K extends StorageKey>(key: K): string {
    logger.debug('getPrefixedKey', key)
    throw new Error('Method not implemented.')
  }

  subscribeToStorageChanged(
    callback: (arg: {
      eventType: 'storageCleared' | 'entryModified'
      key: string | null
      oldValue: string | null
      newValue: string | null
    }) => {}
  ): Promise<void> {
    logger.debug('subscribeToStorageEvent', callback)
    throw new Error('Method not implemented.')
  }

  /**
   * Copies all key/value pairs from the source store into a target store.
   * @param targetDBName Name of the target database.
   * @param targetStoreName Name of the target object store.
   * @param skipKeys Keys to skip.
   * @param sourceStoreName (Optional) Source store name – defaults to the default store.
   */
  public async fillStore(
    targetDBName: string,
    targetStoreName: string,
    skipKeys: string[] = [],
    sourceStoreName: string = this.storeNames[0]
  ): Promise<void> {
    if (!this.isSupported) {
      logger.error('fillStore', 'IndexedDB not supported.')
      return
    }

    const targetDBRequest = indexedDB.open(targetDBName)

    targetDBRequest.onerror = (event: any) => {
      throw new Error(`Failed to open target database: ${event.target.error}`)
    }

    const targetDB = await new Promise<IDBDatabase>((resolve, reject) => {
      targetDBRequest.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result)
      targetDBRequest.onerror = (event: any) => reject(event.target.error)
    })

    // Copy items from the source store to the target store, skipping any specified keys.
    await this.transaction('readonly', sourceStoreName, async (sourceStore) => {
      const getAllRequest = sourceStore.getAll()
      const getAllKeysRequest = sourceStore.getAllKeys()

      getAllRequest.onsuccess = async () => {
        getAllKeysRequest.onsuccess = async () => {
          const items = getAllRequest.result
          const keys = getAllKeysRequest.result

          if (!targetDB.objectStoreNames.contains(targetStoreName)) {
            logger.error(`${targetStoreName} not found. ${new Error().stack}`)
            return
          }

          const targetTransaction = targetDB.transaction(targetStoreName, 'readwrite')
          const targetStore = targetTransaction.objectStore(targetStoreName)

          keys
            .filter((key) => !skipKeys.includes(key.toString()))
            .forEach((key, index) => {
              targetStore.put(items[index], key)
            })

          targetTransaction.onerror = (event: any) => {
            logger.error('Transaction error: ', event.target.error)
          }
        }
      }
      getAllKeysRequest.onerror = () => {
        logger.error('Failed to getAllKeys from source:', getAllKeysRequest.error)
      }
      getAllRequest.onerror = () => {
        logger.error('Failed to getAll from source:', getAllRequest.error)
      }
    })
  }
}
