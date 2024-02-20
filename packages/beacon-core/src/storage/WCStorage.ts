import { StorageKey } from '@airgap/beacon-types'
import { LocalStorage } from './LocalStorage'
import { IndexedDBStorage } from './IndexedDBStorage'

export class WCStorage {
  private readonly localStorage = new LocalStorage()
  private readonly indexedDB = new IndexedDBStorage()
  private channel: BroadcastChannel = new BroadcastChannel('WALLET_CONNECT_V2_INDEXED_DB')
  onMessageHandler: ((type: string) => void) | undefined
  onErrorHandler: ((data: any) => void) | undefined

  constructor() {
    this.indexedDB.openDatabase().catch((err) => console.error(err.message))
    this.channel.onmessage = this.onMessage.bind(this)
    this.channel.onmessageerror = this.onError.bind(this)
  }

  private onMessage(message: MessageEvent) {
    this.onMessageHandler && this.onMessageHandler(message.data.type)
  }

  private onError({ data }: MessageEvent) {
    this.onErrorHandler && this.onErrorHandler(data)
  }

  notify(type: string) {
    this.channel?.postMessage({ type })
  }

  async hasPairings() {
    const pairings = (await this.indexedDB.get(StorageKey.WC_2_CORE_PAIRING)) ?? '[]'

    if (pairings.length) {
      return true
    }

    if (await LocalStorage.isSupported()) {
      return ((await this.localStorage.get(StorageKey.WC_2_CORE_PAIRING)) ?? '[]') !== '[]'
    }

    return false
  }

  async hasSessions() {
    const sessions = (await this.indexedDB.get(StorageKey.WC_2_CLIENT_SESSION)) ?? '[]'

    if (sessions.length) {
      return true
    }

    if (await LocalStorage.isSupported()) {
      return ((await this.localStorage.get(StorageKey.WC_2_CLIENT_SESSION)) ?? '[]') !== '[]'
    }

    return false
  }

  async resetState() {
    await this.indexedDB.clearTable()

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
