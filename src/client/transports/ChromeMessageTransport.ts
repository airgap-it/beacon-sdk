import { Logger } from '../utils/Logger'
import { Transport } from './Transport'

const logger = new Logger('ChromeMessageTransport')

export class ExtensionTransport extends Transport {
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
    chrome.runtime.onMessage.addListener((msg, _sender) => {
      logger.log('init', 'background.js: receive ', msg)
    })
  }
}
