import { SDK_VERSION } from '../constants'
import { Storage, StorageKey } from '@mavrykdynamics/beacon-types'
import { migrate_0_7_0 } from './migrate-0.7.0'

const migrations: [string, Function][] = [
  ['0.6.0', () => undefined],
  ['0.7.0', migrate_0_7_0]
]

// This is not used yet
export const migrate = async (storage: Storage): Promise<void> => {
  const lastSdkVersion: string | undefined = await storage.get(StorageKey.BEACON_SDK_VERSION)

  // Skip if we are on latest version
  if (lastSdkVersion && lastSdkVersion === SDK_VERSION) {
    return
  }

  let addMigration = false
  for (const [version, migrationMethod] of migrations) {
    if (version === lastSdkVersion) {
      addMigration = true
    }

    if (addMigration) {
      try {
        await migrationMethod(storage)
      } catch (migrationError) {
        console.log(`Migration for ${version} failed!`, migrationError)
      }
    }
  }

  await storage.set(StorageKey.BEACON_SDK_VERSION, SDK_VERSION)
}
