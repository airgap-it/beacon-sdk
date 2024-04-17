import { Storage, StorageKey, StorageKeyReturnType } from '@airgap/beacon-types'
import { Logger } from '@airgap/beacon-core'

const logger = new Logger('IndexedDBStorage')

export class IndexedDBStorage extends Storage {
  private db: IDBDatabase | null = null
  private isSupported: boolean = true

  constructor(
    private readonly dbName: string = 'WALLET_CONNECT_V2_INDEXED_DB',
    private readonly storeName: string = 'keyvaluestorage'
  ) {
    super()
    this.initDB()
      .then((db) => (this.db = db))
      .catch((err) => logger.error(err.message))
  }

  private isIndexedDBSupported() {
    if ('indexedDB' in window) {
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
      }

      const request = indexedDB.open(this.dbName)
      request.onupgradeneeded = (event) => {
        const request = event.target as IDBOpenDBRequest
        const db = request.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName)
        }
      }
      request.onsuccess = (event: any) => resolve(event.target.result)
      request.onerror = (event: any) => reject(event.target.error)
    })
  }

  private async transaction<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject('IndexedDB is not supported.')
      }

      if (!this.db?.objectStoreNames.contains(this.storeName)) {
        reject(`${this.storeName} not found. error: ${new Error().stack}`)
      }

      const transaction = this.db?.transaction(this.storeName, mode)
      const objectStore = transaction?.objectStore(this.storeName)
      objectStore && operation(objectStore).then(resolve).catch(reject)
    })
  }

  public get<K extends StorageKey>(key: K): Promise<StorageKeyReturnType[K]> {
    return this.transaction(
      'readonly',
      (store) =>
        new Promise((resolve, reject) => {
          const getRequest = store.get(key)
          getRequest.onsuccess = () => resolve(getRequest.result)
          getRequest.onerror = () => reject(getRequest.error)
        })
    )
  }

  public set<K extends StorageKey>(key: K, value: StorageKeyReturnType[K]): Promise<void> {
    return this.transaction(
      'readwrite',
      (store) =>
        new Promise((resolve, reject) => {
          const putRequest = store.put(value, key)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        })
    )
  }

  public delete<K extends StorageKey>(key: K): Promise<void> {
    return this.transaction(
      'readwrite',
      (store) =>
        new Promise((resolve, reject) => {
          const deleteRequest = store.delete(key)
          deleteRequest.onsuccess = () => resolve()
          deleteRequest.onerror = () => reject(deleteRequest.error)
        })
    )
  }

  public getAll(): Promise<string[]> {
    return this.transaction(
      'readonly',
      (store) =>
        new Promise((resolve, reject) => {
          const getAllRequest = store.getAll()
          getAllRequest.onsuccess = () => resolve(getAllRequest.result)
          getAllRequest.onerror = () => reject(getAllRequest.error)
        })
    )
  }

  public getAllKeys(): Promise<IDBValidKey[]> {
    return this.transaction(
      'readonly',
      (store) =>
        new Promise((resolve, reject) => {
          const getAllKeysRequest = store.getAllKeys()
          getAllKeysRequest.onsuccess = () => resolve(getAllKeysRequest.result)
          getAllKeysRequest.onerror = () => reject(getAllKeysRequest.error)
        })
    )
  }

  public clearStore(): Promise<void> {
    return this.transaction(
      'readwrite',
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
    logger.debug('subscriveToStorageEvent', callback)
    throw new Error('Method not implemented.')
  }

  /**
   * it copies over all key value pairs from a source store into a target one
   * @param targetDBName the name of the target DB
   * @param targetStoreName the name of the target store
   * @param skipKeys all the keys to ignore
   */
  public async fillStore(
    targetDBName: string,
    targetStoreName: string,
    skipKeys: string[] = []
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

    // Copy all items from the source store to the target store, skipping specified keys
    await this.transaction('readonly', async (sourceStore) => {
      const getAllRequest = sourceStore.getAll()
      const getAllKeysRequest = sourceStore.getAllKeys()

      getAllRequest.onsuccess = async () => {
        getAllKeysRequest.onsuccess = async () => {
          const items = getAllRequest.result
          const keys = getAllKeysRequest.result

          if (!targetDB.objectStoreNames.contains(targetStoreName)) {
            logger.error(`${this.storeName} not found. ${new Error().stack}`)
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
