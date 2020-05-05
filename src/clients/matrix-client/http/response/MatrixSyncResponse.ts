interface MatrixJoinedRoom {}

interface MatrixInvitedRoom {}

interface MatrixLeftRoom {}

export interface MatrixSyncRoomResponse {
  join: {
    [key: string]: MatrixJoinedRoom
  }
  invite: {
    [key: string]: MatrixInvitedRoom
  }
  leave: {
    [key: string]: MatrixLeftRoom
  }
}

export interface MatrixSyncResponse {
  next_batch: string
  rooms: MatrixSyncRoomResponse
}
