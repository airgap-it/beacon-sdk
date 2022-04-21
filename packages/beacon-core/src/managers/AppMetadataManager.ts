import { Storage, StorageKey, AppMetadata } from '@airgap/beacon-types'
import { StorageManager } from './StorageManager'

/**
 * @internalapi
 *
 * The AppMetadataManager provides CRUD functionality for app-metadata entities and persists them to the provided storage.
 */
export class AppMetadataManager {
  private readonly storageManager: StorageManager<StorageKey.APP_METADATA_LIST>

  constructor(storage: Storage) {
    this.storageManager = new StorageManager(storage, StorageKey.APP_METADATA_LIST)
  }

  public async getAppMetadataList(): Promise<AppMetadata[]> {
    return this.storageManager.getAll()
  }

  public async getAppMetadata(senderId: string): Promise<AppMetadata | undefined> {
    return this.storageManager.getOne(
      (appMetadata: AppMetadata) => appMetadata.senderId === senderId
    )
  }

  public async addAppMetadata(appMetadata: AppMetadata): Promise<void> {
    return this.storageManager.addOne(
      appMetadata,
      (appMetadataElement: AppMetadata) => appMetadataElement.senderId === appMetadata.senderId
    )
  }

  public async removeAppMetadata(senderId: string): Promise<void> {
    return this.storageManager.remove(
      (appMetadata: AppMetadata) => appMetadata.senderId === senderId
    )
  }

  public async removeAppMetadatas(senderIds: string[]): Promise<void> {
    return this.storageManager.remove((appMetadata: AppMetadata) =>
      senderIds.includes(appMetadata.senderId)
    )
  }

  public async removeAllAppMetadata(): Promise<void> {
    return this.storageManager.removeAll()
  }
}
