export interface MatrixEventSendRequest {
  content: any
}

export interface MatrixEventSendResponse {
  type?: 'event_send'
  event_id: string
}
