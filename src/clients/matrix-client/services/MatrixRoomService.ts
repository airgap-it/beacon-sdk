import { MatrixHttpClient } from '../MatrixHttpClient'
import { MatrixRoom, MatrixRoomStatus } from '../models/MatrixRoom'

import { MatrixSyncRooms } from '../models/api/MatrixSync'
import { MatrixRoomCreateRequest, MatrixRoomCreateResponse } from '../models/api/MatrixRoomCreate'
import { MatrixRoomInviteResponse } from '../models/api/MatrixRoomInvite'
import { MatrixRoomJoinResponse } from '../models/api/MatrixRoomJoin'

export class MatrixRoomService {
  public rooms: Map<string, MatrixRoom> = new Map()

  constructor(private readonly httpClient: MatrixHttpClient) {}

  public storeRooms(rooms: MatrixSyncRooms) {
    this.updateRooms(rooms.join, MatrixRoom.fromJoined)
    this.updateRooms(rooms.invite, MatrixRoom.fromInvited)
    this.updateRooms(rooms.leave, MatrixRoom.fromLeft)
  }

  public getRoom(roomOrId: string | MatrixRoom): MatrixRoom {
    const room = MatrixRoom.from(roomOrId, MatrixRoomStatus.UNKNOWN)
    return this.rooms.get(room.id) || room
  }

  public async createRoom(
    accessToken: string,
    config: MatrixRoomCreateRequest = {}
  ): Promise<MatrixRoomCreateResponse> {
    return this.httpClient.post('/createRoom', config, { accessToken })
  }

  public async inviteToRoom(
    accessToken: string,
    user: string,
    room: MatrixRoom
  ): Promise<MatrixRoomInviteResponse> {
    if (room.status !== MatrixRoomStatus.JOINED && room.status !== MatrixRoomStatus.UNKNOWN) {
      return Promise.reject(`User is not a member of room ${room.id}.`)
    }

    return this.httpClient.post(`/rooms/${room.id}/invite`, { user_id: user }, { accessToken })
  }

  public async joinRoom(accessToken: string, room: MatrixRoom): Promise<MatrixRoomJoinResponse> {
    if (room.status === MatrixRoomStatus.JOINED) {
      return Promise.resolve({ room_id: room.id })
    }

    return this.httpClient.post(`/rooms/${room.id}/join`, {}, { accessToken })
  }

  private updateRooms<T>(
    rooms: { [key: string]: T },
    creator: (id: string, room: T) => MatrixRoom
  ) {
    Object.entries(rooms).forEach(([id, syncRoom]) => {
      const savedRoom = this.rooms.get(id)
      let newRoom = creator(id, syncRoom)

      if (!!savedRoom) {
        newRoom = MatrixRoom.update(savedRoom, newRoom)
      }

      this.rooms.set(id, newRoom)
    })
  }
}
