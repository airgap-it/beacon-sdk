import { forgeMessage } from './message/forger/forger'
import { type Message } from './message/messages'
import { parseMessage } from './message/parser/parser'

export abstract class WebSocketSession {
  public abstract open(url: string): Promise<void>
  public abstract close(): Promise<void>
  
  public async send(message: Message): Promise<void> {
    await this.sendRaw(forgeMessage(message))
  }

  public onMessage(listener: (message: Message) => Promise<void>): void {
    this.onRawMessage((data: Uint8Array) => {
      const message: Message | undefined = parseMessage(data)
      if (message !== undefined) {
        void listener(message)
      }
    })
  }
  
  protected abstract onRawMessage(listener: (data: Uint8Array) => void | Promise<void>): void
  protected abstract sendRaw(data: Uint8Array): Promise<void>
}