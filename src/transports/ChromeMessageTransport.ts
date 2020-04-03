// eslint-disable-next-line spaced-comment
/// <reference types="chrome"/>

import { Logger } from '../utils/Logger'
import { ExtensionMessage, ExtensionMessageTarget } from '../types/ExtensionMessage'
import { Transport, TransportType } from './Transport'

const logger = new Logger('ChromeMessageTransport')

export class ChromeMessageTransport extends Transport {
  public readonly type: TransportType = TransportType.CHROME_MESSAGE

  constructor(name: string) {
    super(name)
    this.init().catch(error => console.error(error))
  }

  public static async isAvailable(): Promise<boolean> {
    const isAvailable: boolean = !!(window.chrome && chrome.runtime && chrome.runtime.id)

    return Promise.resolve(isAvailable)
  }

  public async send(payload: string | Record<string, unknown>): Promise<void> {
    const message: ExtensionMessage<string | Record<string, unknown>> = {
      target: ExtensionMessageTarget.PAGE,
      payload
    }
    chrome.runtime.sendMessage(message)
  }

  private async init(): Promise<void> {
    chrome.runtime.onMessage.addListener((message, _sender) => {
      logger.log('init', 'background.js: receive ', message)
      this.notifyListeners(message, {}).catch(error => logger.error(error))
    })
  }
}
