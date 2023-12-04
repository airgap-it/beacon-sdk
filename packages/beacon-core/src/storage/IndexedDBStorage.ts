export class IndexedDBStorage {
  private readonly dbName: string = 'WALLET_CONNECT_V2_INDEXED_DB'
  private readonly storeName: string = 'keyvaluestorage'
  private db: IDBDatabase | null = null

  static async doesDatabaseExists(): Promise<boolean> {
    const databases = await indexedDB.databases()

    const databaseExists = databases.some(
      (database) => database.name === 'WALLET_CONNECT_V2_INDEXED_DB'
    )

    return databaseExists
  }

  openDatabase(): Promise<string> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)

      request.onupgradeneeded = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result

        // Create object store if it doesn't exist
        if (this.db && !this.db.objectStoreNames.contains(this.storeName)) {
          this.db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true })
        }
      }

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result
        resolve('Database opened successfully')
      }

      request.onerror = (event) => {
        reject(`Error opening database: ${(event.target as IDBOpenDBRequest).error}`)
      }
    })
  }

  addRecord(record: Record<string, any>): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject('Database not open')
        return
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.storeName)

      const request = objectStore.add(record)

      request.onsuccess = () => {
        resolve('Record added successfully')
      }

      request.onerror = (event) => {
        reject(`Error adding record: ${(event.target as IDBRequest).error}`)
      }
    })
  }

  getRecord(id: number): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject('Database not open')
        return
      }

      const transaction = this.db.transaction([this.storeName], 'readonly')
      const objectStore = transaction.objectStore(this.storeName)

      const request = objectStore.get(id)

      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result
        if (result) {
          resolve(result)
        } else {
          reject('Record not found')
        }
      }

      request.onerror = (event) => {
        reject(`Error getting record: ${(event.target as IDBRequest).error}`)
      }
    })
  }

  public async getRecordByKey(keyValue: any): Promise<any | undefined> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName)

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        const transaction = db.transaction(this.storeName, 'readonly')
        const objectStore = transaction.objectStore(this.storeName)

        const getRequest = objectStore.get(keyValue)

        getRequest.onsuccess = () => {
          const result = getRequest.result
          resolve(result)
        }

        getRequest.onerror = (getEvent) => {
          console.error(`Error getting record with key ${keyValue}:`, getEvent.target)
          reject(getEvent.target)
        }
      }

      request.onerror = (event) => {
        console.error('Error opening database:', event.target)
        reject(event.target)
      }
    })
  }

  count(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject('Database not open')
        return
      }

      const transaction = this.db.transaction([this.storeName], 'readonly')
      const objectStore = transaction.objectStore(this.storeName)

      const request = objectStore.count()

      request.onsuccess = () => {
        const count = request.result as number
        resolve(count)
      }

      request.onerror = (event) => {
        reject(`Error getting record count: ${(event.target as IDBRequest).error}`)
      }
    })
  }

  updateRecord(id: number, newData: Record<string, any>): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject('Database not open')
        return
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.storeName)

      const getRequest = objectStore.get(id)

      getRequest.onsuccess = (event) => {
        const existingData = (event.target as IDBRequest).result

        if (existingData) {
          const updateRequest = objectStore.put({ ...existingData, ...newData })

          updateRequest.onsuccess = () => {
            resolve('Record updated successfully')
          }

          updateRequest.onerror = (event) => {
            reject(`Error updating record: ${(event.target as IDBRequest).error}`)
          }
        } else {
          reject('Record not found')
        }
      }

      getRequest.onerror = (event) => {
        reject(`Error getting record: ${(event.target as IDBRequest).error}`)
      }
    })
  }

  deleteRecord(id: number): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject('Database not open')
        return
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.storeName)

      const request = objectStore.delete(id)

      request.onsuccess = () => {
        resolve('Record deleted successfully')
      }

      request.onerror = (event) => {
        reject(`Error deleting record: ${(event.target as IDBRequest).error}`)
      }
    })
  }

  public clearTable(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName)

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        const transaction = db.transaction(this.storeName, 'readwrite')
        const objectStore = transaction.objectStore(this.storeName)

        const clearRequest = objectStore.clear()

        clearRequest.onsuccess = () => {
          console.log(`All entries in ${this.storeName} cleared successfully`)
          resolve()
        }

        clearRequest.onerror = (clearEvent) => {
          console.error(`Error clearing entries in ${this.storeName}:`, clearEvent.target)
          reject(clearEvent.target)
        }
      }

      request.onerror = (event) => {
        console.error('Error opening database:', event.target)
        reject(event.target)
      }
    })
  }
}
