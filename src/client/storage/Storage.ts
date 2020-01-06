export abstract class Storage {
  public static isSupported(): Promise<boolean> { return Promise.resolve(false) }
  abstract get(key: string): Promise<unknown>
  abstract set(key: string, value: string): Promise<void>
  abstract delete(key: string): Promise<void>
}
