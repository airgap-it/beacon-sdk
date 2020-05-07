export interface MatrixEventMessageContent {
  msgtype: 'm.text'
  body: string
  [key: string]: any
}
export interface MatrixEventMessageSendRequest extends MatrixEventSendRequest<any> {}

export interface MatrixEventSendRequest<T> {
  content: T
}

export interface MatrixEventSendResponse {
  type?: 'event_send'
  event_id: string
}
