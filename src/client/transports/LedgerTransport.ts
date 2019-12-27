import { Transport } from './Transport'

export class LedgerTransport extends Transport {
  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(false)
  }
}
