import { Logger } from '../utils/Logger'
import { Transport, TransportType } from './Transport'

const logger = new Logger('ChromeMessageTransport')

export class ChromeMessageTransport extends Transport {
  public readonly type: TransportType = TransportType.CHROME_MESSAGE

  constructor(name: string) {
    super(name)
    this.init().catch(error => console.error(error))
  }

  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(false)
  }

  public async send(payload: string | Record<string, unknown>): Promise<void> {
    chrome.runtime.sendMessage({ method: 'toPage', payload })
  }

  private async init(): Promise<void> {
    chrome.runtime.onMessage.addListener((message, _sender) => {
      logger.log('init', 'background.js: receive ', message)
      this.notifyListeners(message, {}).catch(error => logger.error(error))
    })
  }
}
