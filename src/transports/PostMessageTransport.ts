import { myWindow } from '../MockWindow'
import { ExtensionMessage, ExtensionMessageTarget, TransportType } from '..'
import { Origin } from '../types/Origin'
import { Transport } from './Transport'

export class PostMessageTransport extends Transport {
  public readonly type: TransportType = TransportType.POST_MESSAGE

  constructor(name: string) {
    super(name)
    this.init().catch((error) => console.error(error))
  }

  public static async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fn = (event): void => {
        const data = event.data as ExtensionMessage<string>
        if (data && data.payload === 'pong') {
          resolve(true)
          myWindow.removeEventListener('message', fn)
        }
      }

      myWindow.addEventListener('message', fn)

      const message: ExtensionMessage<string> = {
        target: ExtensionMessageTarget.EXTENSION,
        payload: 'ping'
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      myWindow.postMessage(message as any, '*')
    })
  }

  public async init(): Promise<void> {
    myWindow.addEventListener('message', (message) => {
      if (typeof message === 'object' && message) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: {
          message: ExtensionMessage<{ beaconMessage: string }>
          sender: chrome.runtime.MessageSender
        } = (message as any).data
        if (data.message && data.message.target === ExtensionMessageTarget.PAGE) {
          this.notifyListeners(data.message.payload, {
            origin: Origin.EXTENSION,
            id: data.sender.id || ''
          }).catch((error) => {
            throw error
          })
        }
      }
    })
  }

  public async send(message: string): Promise<void> {
    const data: ExtensionMessage<string> = {
      target: ExtensionMessageTarget.EXTENSION,
      payload: message
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    myWindow.postMessage(data as any, '*')
  }
}
