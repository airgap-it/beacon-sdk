import { StorageKey } from '@airgap/beacon-types'
import { LocalStorage } from './LocalStorage'
import { IndexedDBStorage } from './IndexedDBStorage'

export class WCStorage {
  private readonly localStorage = new LocalStorage()
  private readonly indexedDB = new IndexedDBStorage()

  constructor() {
    IndexedDBStorage.doesDatabaseExist().then((exists) => {
      if (exists) {
        this.indexedDB.openDatabase().catch((error) => console.error(error.message))
      }
    })
  }

  async hasPairings() {
    if (await IndexedDBStorage.doesDatabaseExist()) {
      return ((await this.indexedDB.get(StorageKey.WC_2_CORE_PAIRING)) ?? '[]') !== '[]'
    }

    if (await LocalStorage.isSupported()) {
      return ((await this.localStorage.get(StorageKey.WC_2_CORE_PAIRING)) ?? '[]') !== '[]'
    }

    return false
  }

  async hasSessions() {
    if (await IndexedDBStorage.doesDatabaseExist()) {
      return ((await this.indexedDB.get(StorageKey.WC_2_CLIENT_SESSION)) ?? '[]') !== '[]'
    }

    if (await LocalStorage.isSupported()) {
      return ((await this.localStorage.get(StorageKey.WC_2_CLIENT_SESSION)) ?? '[]') !== '[]'
    }

    return false
  }

  async resetState() {
    if (await IndexedDBStorage.doesDatabaseExist()) {
      await this.indexedDB.clearTable()
      return
    }

    if (await LocalStorage.isSupported()) {
      await Promise.all([
        this.localStorage.delete(StorageKey.WC_2_CLIENT_SESSION),
        this.localStorage.delete(StorageKey.WC_2_CORE_PAIRING),
        this.localStorage.delete(StorageKey.WC_2_CORE_KEYCHAIN),
        this.localStorage.delete(StorageKey.WC_2_CORE_MESSAGES),
        this.localStorage.delete(StorageKey.WC_2_CLIENT_PROPOSAL),
        this.localStorage.delete(StorageKey.WC_2_CORE_SUBSCRIPTION),
        this.localStorage.delete(StorageKey.WC_2_CORE_HISTORY),
        this.localStorage.delete(StorageKey.WC_2_CORE_EXPIRER)
      ])
    }
  }
}
