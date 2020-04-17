import { defaultValues } from './Storage'
import { Storage, StorageKey, StorageKeyReturnType } from '..'

export class LocalStorage implements Storage {
  public static async isSupported(): Promise<boolean> {
    return Promise.resolve(typeof window !== 'undefined' && !!window.localStorage)
  }

  public async get<K extends StorageKey>(key: K): Promise<StorageKeyReturnType[K]> {
    const value = localStorage.getItem(key)
    if (!value) {
      return defaultValues[key]
    } else {
      try {
        return JSON.parse(value)
      } catch (jsonParseError) {
        return value as StorageKeyReturnType[K] // TODO: Validate storage
      }
    }
  }

  public async set<K extends StorageKey>(key: K, value: StorageKeyReturnType[K]): Promise<void> {
    if (typeof value === 'string') {
      return localStorage.setItem(key, value)
    } else {
      return localStorage.setItem(key, JSON.stringify(value))
    }
  }

  public async delete<K extends StorageKey>(key: K): Promise<void> {
    return Promise.resolve(localStorage.removeItem(key))
  }
}
