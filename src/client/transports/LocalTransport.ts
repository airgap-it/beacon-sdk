import { Transport } from './Transport'

export class LocalTransport extends Transport {
  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(false)
  }
}
