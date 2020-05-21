import { AppMetadata, Storage, StorageKey } from '..'

export class AppMetadataManager {
  private readonly storage: Storage

  constructor(storage: Storage) {
    this.storage = storage
  }

  public async getAppMetadataList(): Promise<AppMetadata[]> {
    return this.storage.get(StorageKey.APP_METADATA_LIST)
  }

  public async getAppMetadata(beaconId: string): Promise<AppMetadata | undefined> {
    const appMetadataList: AppMetadata[] = await this.storage.get(StorageKey.APP_METADATA_LIST)

    return appMetadataList.find((appMetadata: AppMetadata) => appMetadata.beaconId === beaconId)
  }

  public async addAppMetadata(appMetadata: AppMetadata): Promise<void> {
    const appMetadataList: AppMetadata[] = await this.storage.get(StorageKey.APP_METADATA_LIST)

    if (
      !appMetadataList.some(
        (appMetadataElement: AppMetadata) => appMetadataElement.beaconId === appMetadata.beaconId
      )
    ) {
      appMetadataList.push(appMetadata)
    }

    return this.storage.set(StorageKey.APP_METADATA_LIST, appMetadataList)
  }

  public async removeAppMetadata(beaconId: string): Promise<void> {
    const appMetadataList: AppMetadata[] = await this.storage.get(StorageKey.APP_METADATA_LIST)

    const filteredAppMetadataList: AppMetadata[] = appMetadataList.filter(
      (appMetadata: AppMetadata) => appMetadata.beaconId !== beaconId
    )

    return this.storage.set(StorageKey.APP_METADATA_LIST, filteredAppMetadataList)
  }

  public async removeAllAppMetadata(): Promise<void> {
    return this.storage.delete(StorageKey.APP_METADATA_LIST)
  }
}
