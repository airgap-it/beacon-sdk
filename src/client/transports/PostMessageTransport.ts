import { myWindow } from '../MockWindow'
import { Transport } from './Transport'

export class PostMessageTransport extends Transport {
  constructor() {
    super()
    this.init().catch(error => console.error(error))
  }

  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(false)
  }

  public async init(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    myWindow.addEventListener('message', (event: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.notifyListeners(event.data).catch(error => {
        throw error
      })
    })
  }

  public async send(message: string): Promise<void> {
    myWindow.postMessage(message, '*')
  }
}
