export interface Storage {
  isSupported(): Promise<boolean>
  get(key: string): Promise<any>
  set(key: string, value: string): Promise<void>
  delete(key: string): Promise<void>
}
