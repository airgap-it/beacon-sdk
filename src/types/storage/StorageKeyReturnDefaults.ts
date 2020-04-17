import { StorageKey, StorageKeyReturnType } from '../..'

export type StorageKeyReturnDefaults = { [key in StorageKey]: StorageKeyReturnType[key] }
