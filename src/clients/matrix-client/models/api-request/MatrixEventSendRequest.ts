import { MatrixRequest } from './MatrixRequest'

export interface MatrixEventSendRequest<T> extends MatrixRequest {
  content: T
}

export interface MatrixEventMessageContent {
  msgtype: 'm.text'
  body: string
  [key: string]: any
}
export interface MatrixEventMessageSendRequest extends MatrixEventSendRequest<any> {}
