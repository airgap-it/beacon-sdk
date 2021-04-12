import { MatrixMessageType } from './MatrixMessage'

export interface MatrixStateEventMessageText extends MatrixStateEventMessage {
  type: 'm.room.message'
  content: {
    msgtype: MatrixMessageType.TEXT
    body: string
  }
}

export interface MatrixStateEventMessageContent {
  msgtype: string
  body: any
  [key: string]: any
}

export interface MatrixStateEventMessage extends MatrixStateEvent {
  type: 'm.room.message'
  content: MatrixStateEventMessageContent
}

export interface MatrixStateEvent {
  type: string
  sender: string
  content: unknown
  event_id?: string
  origin_server_ts: number
}
