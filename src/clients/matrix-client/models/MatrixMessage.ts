import { MatrixStateEvent } from './MatrixStateEvent'
import { isTextMessageEvent } from '../utils/events'

export class MatrixMessage<T> {
  public static from(event: MatrixStateEvent): MatrixMessage<any> | undefined {
    if (isTextMessageEvent(event)) {
      return new MatrixMessage(event.content.msgtype, event.sender, event.content.body)
    }

    // for now only text messages are supported
    return undefined
  }

  constructor(readonly type: string, readonly sender: string, readonly content: T) {}
}
