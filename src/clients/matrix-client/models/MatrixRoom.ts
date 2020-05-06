import {
  MatrixJoinedRoomResponse,
  MatrixInvitedRoomResponse,
  MatrixLeftRoomResponse
} from './api-response/MatrixSyncResponse'

export enum MatrixRoomStatus {
  UNKNOWN,
  JOINED,
  INVITED,
  LEFT
}

export class MatrixRoom {
  public static from(roomOrId: string | MatrixRoom, status?: MatrixRoomStatus): MatrixRoom {
    return roomOrId instanceof MatrixRoom
      ? status
        ? new MatrixRoom(roomOrId.id, status)
        : roomOrId
      : new MatrixRoom(roomOrId, status || MatrixRoomStatus.UNKNOWN)
  }

  public static fromJoined(id: string, _joined: MatrixJoinedRoomResponse): MatrixRoom {
    return new MatrixRoom(id, MatrixRoomStatus.JOINED)
  }

  public static fromInvited(id: string, _invited: MatrixInvitedRoomResponse): MatrixRoom {
    return new MatrixRoom(id, MatrixRoomStatus.INVITED)
  }

  public static fromLeft(id: string, _left: MatrixLeftRoomResponse): MatrixRoom {
    return new MatrixRoom(id, MatrixRoomStatus.LEFT)
  }

  constructor(readonly id: string, readonly status: MatrixRoomStatus) {}
}
