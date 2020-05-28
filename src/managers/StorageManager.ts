import { StorageKey, Storage, StorageKeyReturnType } from '..'

/** Type workaround for https://github.com/Microsoft/TypeScript/issues/7294#issuecomment-465794460 */
type ArrayElem<A> = A extends (infer Elem)[] ? Elem : never

/* eslint-disable prefer-arrow/prefer-arrow-functions */
function fixArrayType<T>(array: T): ArrayElem<T>[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return array as any
}
/* eslint-enable prefer-arrow/prefer-arrow-functions */

export class StorageManager<
  T extends StorageKey.ACCOUNTS | StorageKey.APP_METADATA_LIST | StorageKey.PERMISSION_LIST
> {
  private readonly storage: Storage
  private readonly storageKey: T

  constructor(storage: Storage, storageKey: T) {
    this.storage = storage
    this.storageKey = storageKey
  }

  public async getAll(): Promise<StorageKeyReturnType[T]> {
    return this.storage.get(this.storageKey)
  }

  public async getOne(
    predicate: (element: ArrayElem<StorageKeyReturnType[T]>) => boolean
  ): Promise<ArrayElem<StorageKeyReturnType[T]> | undefined> {
    const entities = await this.storage.get(this.storageKey)

    return fixArrayType(entities).find(predicate)
  }

  public async addOne(
    element: ArrayElem<StorageKeyReturnType[T]>,
    predicate: (element: ArrayElem<StorageKeyReturnType[T]>) => boolean
  ): Promise<void> {
    const entities = await this.storage.get(this.storageKey)

    if (!fixArrayType(entities).some(predicate)) {
      fixArrayType(entities).push(element)
    }

    return this.storage.set(this.storageKey, entities)
  }

  public async remove(
    predicate: (element: ArrayElem<StorageKeyReturnType[T]>) => boolean
  ): Promise<void> {
    const entities = await this.storage.get(this.storageKey)

    const filteredEntities = fixArrayType(entities).filter((entity) => !predicate(entity))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.storage.set(this.storageKey, filteredEntities as any)
  }

  public async removeAll(): Promise<void> {
    return this.storage.delete(this.storageKey)
  }
}
