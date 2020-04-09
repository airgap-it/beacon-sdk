// eslint-disable-next-line spaced-comment
/// <reference types="chrome"/>

import { Logger } from '../utils/Logger'
import { ExtensionMessage, ExtensionMessageTarget } from '../types/ExtensionMessage'
import { Transport, TransportType } from './Transport'

const logger = new Logger('ChromeMessageTransport')

interface ConnectionContext {
  sender: chrome.runtime.MessageSender
  sendResponse(response?: unknown): void
}

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
    chrome.runtime.onMessage.addListener(
      (
        message: ExtensionMessage<string>,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: unknown) => void
      ) => {
        logger.log('init', 'receiving chrome message', message, sender)
        const connectionContext: ConnectionContext = { sender, sendResponse }
        this.notifyListeners(message.payload, connectionContext).catch(error => logger.error(error))

        // return true from the event listener to indicate you wish to send a response asynchronously
        // (this will keep the message channel open to the other end until sendResponse is called).
        return true
      }
    )
  }
}
