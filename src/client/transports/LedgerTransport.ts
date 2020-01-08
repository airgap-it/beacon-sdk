import { Transport, TransportType } from './Transport'

export class LedgerTransport extends Transport {
  public readonly type: TransportType = TransportType.LEDGER

  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(false)
  }
}
