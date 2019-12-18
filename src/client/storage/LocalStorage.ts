import { Storage } from './Storage'

export class LocalStorage implements Storage {
  public async isSupported(): Promise<boolean> {
    return Promise.resolve(typeof window !== 'undefined' && !!window.localStorage)
  }

  public async get(key: string): Promise<unknown> {
    return localStorage.getItem(key)
  }

  public async set(key: string, value: string): Promise<void> {
    return localStorage.setItem(key, value)
  }

  public async delete(key: string): Promise<void> {
    return localStorage.removeItem(key)
  }
}
