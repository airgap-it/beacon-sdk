import { myWindow } from '../MockWindow'
import { ExtensionMessage, ExtensionMessageTarget, TransportType, Transport } from '..'

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

      setTimeout(() => {
        resolve(false)
        myWindow.removeEventListener('message', fn)
      }, 100)
    })
  }

  public async init(): Promise<void> {
    myWindow.addEventListener('message', (message) => {
      if (typeof message === 'object' && message) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: ExtensionMessage<string> = (message as any).data
        if (data.target === ExtensionMessageTarget.PAGE) {
          this.notifyListeners(data.payload, {}).catch((error) => {
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
