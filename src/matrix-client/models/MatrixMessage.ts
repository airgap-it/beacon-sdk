import { isTextMessageEvent } from '../utils/events'
import { MatrixStateEvent } from './MatrixStateEvent'

export enum MatrixMessageType {
  TEXT = 'm.text'
}

export class MatrixMessage<T> {
  public static from(event: MatrixStateEvent): MatrixMessage<any> | undefined {
    if (isTextMessageEvent(event)) {
      return new MatrixMessage(event.content.msgtype, event.sender, event.content.body)
    }

    // for now only text messages are supported
    return undefined
  }

  private constructor(
    public readonly type: MatrixMessageType,
    public readonly sender: string,
    public readonly content: T
  ) {}
}
