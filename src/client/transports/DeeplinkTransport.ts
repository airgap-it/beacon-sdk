import { Transport, TransportType } from './Transport'

export class DeeplinkTransport extends Transport {
  public readonly type: TransportType = TransportType.DEEPLINK

  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(false)
  }
}
