export interface MatrixStateEventMessageText extends MatrixStateEventMessage {
  type: 'm.room.message'
  content: {
    msgtype: 'm.text'
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
  event_id: string
}
