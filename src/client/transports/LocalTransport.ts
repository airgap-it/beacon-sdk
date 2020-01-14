import { Logger } from '../utils/Logger'
import { Transport } from './Transport'

const logger = new Logger('LocalTransport')

export class LocalTransport extends Transport {
  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(false)
  }

  public transformer: (message: string) => string = (message: string) => message

  public async send(message: string): Promise<void> {
    logger.log('send', message)

    const transformedMessage = this.transformer ? this.transformer(message) : message
    await this.notifyListeners(transformedMessage)

    return
  }
}
