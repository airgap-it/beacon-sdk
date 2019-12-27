import { Transport } from './Transport'

export class DeeplinkTransport extends Transport {
  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(false)
  }
}
