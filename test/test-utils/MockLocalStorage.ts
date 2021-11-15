export class MockLocalStorage {
  private storage: Map<string, any>

  constructor() {
    this.storage = new Map()
  }
  setItem(key: any, value: any) {
    this.storage.set(key, value)
  }
  getItem(key: any) {
    return this.storage.get(key)
  }
  removeItem(key: any) {
    this.storage.delete(key)
  }
  clear() {
    this.storage.clear()
  }
}
