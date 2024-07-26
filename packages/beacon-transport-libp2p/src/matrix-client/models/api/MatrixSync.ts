import { MatrixStateEvent } from '../MatrixStateEvent'

export interface MatrixSyncJoinedRoom {
  state: {
    events: MatrixStateEvent[]
  }
  timeline: {
    events: MatrixStateEvent[]
  }
}

export interface MatrixSyncInvitedRoom {
  invite_state: {
    events: MatrixStateEvent[]
  }
}

export interface MatrixSyncLeftRoom {
  state: {
    events: MatrixStateEvent[]
  }
  timeline: {
    events: MatrixStateEvent[]
  }
}

export interface MatrixSyncRooms {
  join?: {
    [key: string]: MatrixSyncJoinedRoom
  }
  invite?: {
    [key: string]: MatrixSyncInvitedRoom
  }
  leave?: {
    [key: string]: MatrixSyncLeftRoom
  }
}

export interface MatrixSyncRequestParams {
  timeout?: number
  since?: string
}

export interface MatrixSyncResponse {
  type?: 'sync'
  next_batch: string
  rooms?: MatrixSyncRooms
}
