import { myWindow } from '../MockWindow'
import { Transport, TransportType } from './Transport'

export class PostMessageTransport extends Transport {
  public readonly type: TransportType = TransportType.POST_MESSAGE

  constructor(name: string) {
    super(name)
    this.init().catch(error => console.error(error))
  }

  public static async isAvailable(): Promise<boolean> {
    return new Promise(resolve => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fn = (event: any): void => {
        if (event.data && event.data.payload === 'pong') {
          resolve(true)
          myWindow.removeEventListener('message', fn)
        }
      }

      myWindow.addEventListener('message', fn)

      myWindow.postMessage({ method: 'toExtension', payload: 'ping' }, '*')

      setTimeout(() => {
        resolve(false)
        myWindow.removeEventListener('message', fn)
      }, 100)
    })
  }

  public async init(): Promise<void> {
    myWindow.addEventListener('message', message => {
      if (typeof message === 'object' && message) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (message as any).data
        if (data.method === 'toPage') {
          this.notifyListeners(data.payload, {}).catch(error => {
            throw error
          })
        }
      }
    })
  }

  public async send(message: string): Promise<void> {
    myWindow.postMessage({ method: 'toExtension', payload: message }, '*')
  }
}
