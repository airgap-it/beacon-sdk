import { Storage, StorageKey, AppMetadata } from '..'
import { StorageManager } from './StorageManager'

export class AppMetadataManager {
  private readonly storageManager: StorageManager<StorageKey.APP_METADATA_LIST>

  constructor(storage: Storage) {
    this.storageManager = new StorageManager(storage, StorageKey.APP_METADATA_LIST)
  }

  public async getAppMetadataList(): Promise<AppMetadata[]> {
    return this.storageManager.getAll()
  }

  public async getAppMetadata(beaconId: string): Promise<AppMetadata | undefined> {
    return this.storageManager.getOne(
      (appMetadata: AppMetadata) => appMetadata.beaconId === beaconId
    )
  }

  public async addAppMetadata(appMetadata: AppMetadata): Promise<void> {
    return this.storageManager.addOne(
      appMetadata,
      (appMetadataElement: AppMetadata) => appMetadataElement.beaconId === appMetadata.beaconId
    )
  }

  public async removeAppMetadata(beaconId: string): Promise<void> {
    return this.storageManager.remove(
      (appMetadata: AppMetadata) => appMetadata.beaconId === beaconId
    )
  }

  public async removeAppMetadatas(beaconIds: string[]): Promise<void> {
    return this.storageManager.remove((appMetadata: AppMetadata) =>
      beaconIds.includes(appMetadata.beaconId)
    )
  }

  public async removeAllAppMetadata(): Promise<void> {
    return this.storageManager.removeAll()
  }
}
