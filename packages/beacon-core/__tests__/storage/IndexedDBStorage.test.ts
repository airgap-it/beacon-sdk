// __tests__/storage/IndexedDBStorage.test.ts

import { IndexedDBStorage } from '../../src/storage/IndexedDBStorage'
import { Logger } from '@airgap/beacon-core'

// ----- Fake IndexedDB Classes -----

class FakeIDBObjectStore {
  data: Map<any, any> = new Map()

  get(key: any) {
    const req: any = { result: this.data.get(key), onsuccess: null, onerror: null }
    setTimeout(() => req.onsuccess && req.onsuccess(), 0)
    return req
  }

  put(value: any, key: any) {
    this.data.set(key, value)
    const req: any = { onsuccess: null, onerror: null }
    setTimeout(() => req.onsuccess && req.onsuccess(), 0)
    return req
  }

  delete(key: any) {
    this.data.delete(key)
    const req: any = { onsuccess: null, onerror: null }
    setTimeout(() => req.onsuccess && req.onsuccess(), 0)
    return req
  }

  getAll() {
    const req: any = { result: Array.from(this.data.values()), onsuccess: null, onerror: null }
    setTimeout(() => req.onsuccess && req.onsuccess(), 0)
    return req
  }

  getAllKeys() {
    const req: any = { result: Array.from(this.data.keys()), onsuccess: null, onerror: null }
    setTimeout(() => req.onsuccess && req.onsuccess(), 0)
    return req
  }

  clear() {
    this.data.clear()
    const req: any = { onsuccess: null, onerror: null }
    setTimeout(() => req.onsuccess && req.onsuccess(), 0)
    return req
  }
}

class FakeIDBTransaction {
  private store: FakeIDBObjectStore
  constructor(store: FakeIDBObjectStore) {
    this.store = store
  }
  objectStore(_storeName: string) {
    return this.store
  }
}

class FakeIDBDatabase {
  stores: { [storeName: string]: FakeIDBObjectStore } = {}
  objectStoreNames: { contains: (storeName: string) => boolean }
  version: number = 1
  constructor(storeNames: string[]) {
    storeNames.forEach((name) => {
      this.stores[name] = new FakeIDBObjectStore()
    })
    this.objectStoreNames = {
      contains: (storeName: string) => !!this.stores[storeName]
    }
  }
  transaction(storeName: string, _mode: IDBTransactionMode): FakeIDBTransaction {
    if (!this.stores[storeName]) throw new Error(`Store ${storeName} does not exist`)
    return new FakeIDBTransaction(this.stores[storeName])
  }
}

// ----- Test Suite -----

// Create a fake database with a default store (the default store name is taken from IndexedDBStorage, which defaults to 'keyvaluestorage')
const fakeDb = new FakeIDBDatabase(['keyvaluestorage'])

describe('IndexedDBStorage', () => {
  let storageInstance: any // IndexedDBStorage type

  beforeEach(async () => {
    // Override initDB to immediately resolve with our fake DB.
    jest.spyOn(IndexedDBStorage.prototype as any, 'initDB').mockResolvedValue(fakeDb)
    storageInstance = new IndexedDBStorage()
    // Allow the constructor's async init to resolve.
    await new Promise((resolve) => setTimeout(resolve, 10))
  })

  describe('get', () => {
    it('should retrieve a value by key', async () => {
      const store = fakeDb.stores['keyvaluestorage']
      store.data.set('testKey', 'testValue')
      const result = await storageInstance.get('testKey')
      expect(result).toEqual('testValue')
    })

    it('should return undefined if the key is not present', async () => {
      const result = await storageInstance.get('nonExistingKey')
      expect(result).toBeUndefined()
    })
  })

  describe('set', () => {
    it('should store a key/value pair', async () => {
      await storageInstance.set('setKey', 'setValue')
      const store = fakeDb.stores['keyvaluestorage']
      expect(store.data.get('setKey')).toEqual('setValue')
    })
  })

  describe('delete', () => {
    it('should delete a key', async () => {
      const store = fakeDb.stores['keyvaluestorage']
      store.data.set('delKey', 'delValue')
      await storageInstance.delete('delKey')
      expect(store.data.has('delKey')).toBe(false)
    })
  })

  describe('getAll', () => {
    it('should retrieve all values from the store', async () => {
      const store = fakeDb.stores['keyvaluestorage']
      store.data.clear()
      store.data.set('key1', 'value1')
      store.data.set('key2', 'value2')
      const result = await storageInstance.getAll()
      expect(result).toEqual(expect.arrayContaining(['value1', 'value2']))
      expect(result.length).toBe(2)
    })
  })

  describe('getAllKeys', () => {
    it('should retrieve all keys from the store', async () => {
      const store = fakeDb.stores['keyvaluestorage']
      store.data.clear()
      store.data.set('keyA', 'valueA')
      store.data.set('keyB', 'valueB')
      const result = await storageInstance.getAllKeys()
      expect(result).toEqual(expect.arrayContaining(['keyA', 'keyB']))
      expect(result.length).toBe(2)
    })
  })

  describe('clearStore', () => {
    it('should clear all entries from the store', async () => {
      const store = fakeDb.stores['keyvaluestorage']
      store.data.set('keyX', 'valueX')
      store.data.set('keyY', 'valueY')
      await storageInstance.clearStore()
      const result = await storageInstance.getAll()
      expect(result).toEqual([])
    })
  })

  describe('getPrefixedKey', () => {
    it('should throw an error because method is not implemented', () => {
      expect(() => storageInstance.getPrefixedKey('anyKey')).toThrow('Method not implemented.')
    })
  })

//   describe('subscribeToStorageChanged', () => {
//     it('should throw an error because method is not implemented', async () => {
//       await expect(storageInstance.subscribeToStorageChanged(() => {})).rejects.toThrow(
//         'Method not implemented.'
//       )
//     })
//   })

  describe('fillStore', () => {
    let originalIndexedDB: any
    let fakeTargetDb: FakeIDBDatabase

    beforeEach(() => {
      originalIndexedDB = global.indexedDB
      fakeTargetDb = new FakeIDBDatabase(['targetStore'])
      // Mock indexedDB.open to simulate opening the target database.
      ;(global as any).indexedDB = {
        open: jest.fn((dbName: string, version?: number) => {
          const req: any = {}
          setTimeout(() => {
            req.result = fakeTargetDb
            req.onsuccess && req.onsuccess({ target: req })
          }, 0)
          return req
        })
      }
    })

    afterEach(() => {
      global.indexedDB = originalIndexedDB
    })

    it('should copy items from source store to target store when target store exists', async () => {
      const sourceStore = fakeDb.stores['keyvaluestorage']
      sourceStore.data.clear()
      sourceStore.data.set('k1', 'v1')
      sourceStore.data.set('k2', 'v2')

      expect(fakeTargetDb.objectStoreNames.contains('targetStore')).toBe(true)

      await storageInstance.fillStore('targetDB', 'targetStore', ['skipKey'], 'keyvaluestorage')

      // Wait a bit to allow asynchronous callbacks to run.
      await new Promise((resolve) => setTimeout(resolve, 50))

      const targetStore = fakeTargetDb.stores['targetStore']
      const copiedValues = Array.from(targetStore.data.values())
      expect(copiedValues).toEqual(expect.arrayContaining(['v1', 'v2']))
    })

    it('should log an error if target store does not exist', async () => {
      fakeTargetDb = new FakeIDBDatabase([]) // no stores
      ;(global as any).indexedDB = {
        open: jest.fn((dbName: string, version?: number) => {
          const req: any = {}
          setTimeout(() => {
            req.result = fakeTargetDb
            req.onsuccess && req.onsuccess({ target: req })
          }, 0)
          return req
        })
      }

      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {})
      await storageInstance.fillStore('targetDB', 'missingStore', [], 'keyvaluestorage')

      // Wait to allow asynchronous logging to occur.
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(loggerErrorSpy).toHaveBeenCalled()
      loggerErrorSpy.mockRestore()
    })
  })
})
