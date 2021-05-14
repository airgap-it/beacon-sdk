import { MatrixMessage } from './MatrixMessage'

export enum MatrixClientEventType {
  INVITE = 'invite',
  MESSAGE = 'message'
}

export type MatrixClientEventContent<T> = T extends MatrixClientEventType.INVITE
  ? MatrixClientEventInviteContent
  : T extends MatrixClientEventType.MESSAGE
  ? MatrixClientEventMessageContent<unknown>
  : never

export interface MatrixClientEventInviteContent {
  roomId: string
  members: string[]
}

export interface MatrixClientEventMessageContent<T> {
  roomId: string
  message: MatrixMessage<T>
}

export interface MatrixClientEvent<T extends MatrixClientEventType> {
  type: T
  content: MatrixClientEventContent<T>
  timestamp?: number
}
