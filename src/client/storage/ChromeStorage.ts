import { Storage } from './Storage'

export class ChromeStorage implements Storage {
  public static async isSupported(): Promise<boolean> {
    return Promise.resolve(
      typeof window !== 'undefined' && chrome && chrome.runtime && !!chrome.runtime.id
    )
  }

  public async get(key: string): Promise<unknown> {
    return new Promise(resolve => {
      chrome.storage.local.get(null, storageContent => {
        resolve(storageContent[key])
      })
    })
  }

  public async set(key: string, value: string): Promise<void> {
    return new Promise(resolve => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve()
      })
    })
  }

  public async delete(key: string): Promise<void> {
    return new Promise(resolve => {
      chrome.storage.local.set({ [key]: undefined }, () => {
        resolve()
      })
    })
  }
}
