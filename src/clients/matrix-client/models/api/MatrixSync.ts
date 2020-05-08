export interface MatrixSyncRoomStateEvent {
  content: any
  type: string
  sender: string
}

export interface MatrixSyncJoinedRoom {
  state: {
    events: MatrixSyncRoomStateEvent[]
  }
  timeline: {
    events: MatrixSyncRoomStateEvent[]
  }
}

export interface MatrixSyncInvitedRoom {
  events: MatrixSyncRoomStateEvent[]
}

export interface MatrixSyncLeftRoom {
  state: {
    events: MatrixSyncRoomStateEvent[]
  }
  timeline: {
    events: MatrixSyncRoomStateEvent[]
  }
}

export interface MatrixSyncRooms {
  join: {
    [key: string]: MatrixSyncJoinedRoom
  }
  invite: {
    [key: string]: MatrixSyncInvitedRoom
  }
  leave: {
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
  rooms: MatrixSyncRooms
}
