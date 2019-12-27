import { Logger } from '../utils/Logger'
import { Transport } from './Transport'

const logger = new Logger('ChromeMessageTransport')

export class ChromeMessageTransport extends Transport {
  constructor() {
    super()
    this.init().catch(error => console.error(error))
  }

  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(false)
  }

  public async send(message: string): Promise<void> {
    chrome.runtime.sendMessage(message)
  }

  private async init(): Promise<void> {
    chrome.runtime.onMessage.addListener((message, _sender) => {
      logger.log('init', 'background.js: receive ', message)
      this.notifyListeners(message).catch(error => logger.error(error))
    })
  }
}
