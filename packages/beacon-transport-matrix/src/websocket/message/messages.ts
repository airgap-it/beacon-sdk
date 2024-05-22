import { type V1Message } from './v1-messages'

export interface BaseMessage<V extends number> {
  version: V
  sender: Uint8Array
  recipient: Uint8Array
}

export type Message = V1Message
