export class MockLocalStorage {
  private storage: Map<string, any>

  constructor() {
    this.storage = new Map()
  }
  setItem(key, value) {
    this.storage.set(key, value)
  }
  getItem(key) {
    return this.storage.get(key)
  }
  removeItem(key) {
    this.storage.delete(key)
  }
  clear() {
    this.constructor()
  }
}
