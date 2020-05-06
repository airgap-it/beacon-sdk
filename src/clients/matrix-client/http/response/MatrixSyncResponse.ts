import { MatrixResponse } from './MatrixResponse'

export interface MatrixJoinedRoomResponse {}

export interface MatrixInvitedRoomResponse {}

export interface MatrixLeftRoomResponse {}

export interface MatrixSyncRoomResponse {
  join: {
    [key: string]: MatrixJoinedRoomResponse
  }
  invite: {
    [key: string]: MatrixInvitedRoomResponse
  }
  leave: {
    [key: string]: MatrixLeftRoomResponse
  }
}

export interface MatrixSyncResponse extends MatrixResponse<any> {
  next_batch: string
  rooms: MatrixSyncRoomResponse
}
