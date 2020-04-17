import { Logger } from '../utils/Logger'
import { Transport } from '..'

const logger = new Logger('LocalTransport')

// Only used for testing
export class LocalTransport extends Transport {
  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(false)
  }

  public transformer: (message: string) => Promise<string> = (message: string) =>
    Promise.resolve(message)

  public async send(message: string): Promise<void> {
    logger.log('send', message)

    const transformedMessage = this.transformer ? this.transformer(message) : message
    await this.notifyListeners(transformedMessage, {})

    return
  }
}
