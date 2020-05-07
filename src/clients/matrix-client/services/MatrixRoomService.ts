import { MatrixHttpClient } from '../MatrixHttpClient'
import { MatrixRoom, MatrixRoomStatus } from '../models/MatrixRoom'

import { MatrixRoomJoinRequest } from '../models/api-request/MatrixRoomJoinRequest'
import { MatrixRoomJoinResponse } from '../models/api-response/MatrixRoomJoinResponse'

import { MatrixRoomInviteRequest } from '../models/api-request/MatrixRoomInviteRequest'
import { MatrixRoomInviteResponse } from '../models/api-response/MatrixRoomInviteResponse'

import { MatrixRoomCreateResponse } from '../models/api-response/MatrixRoomCreateResponse'
import { MatrixRoomCreateRequest } from '../models/api-request/MatrixRoomCreateRequest'

import { MatrixSyncRooms } from '../models/api-response/MatrixSyncResponse'

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
    return this.httpClient.post<MatrixRoomCreateRequest, MatrixRoomCreateResponse>(
      '/createRoom',
      config,
      { accessToken }
    )
  }

  public async inviteToRoom(accessToken: string, user: string, room: MatrixRoom): Promise<void> {
    if (room.status !== MatrixRoomStatus.JOINED && room.status !== MatrixRoomStatus.UNKNOWN) {
      return Promise.reject(`User is not a member of room ${room.id}.`)
    }

    await this.httpClient.post<MatrixRoomInviteRequest, MatrixRoomInviteResponse>(
      `/rooms/${room.id}/invite`,
      { user_id: user },
      { accessToken }
    )
  }

  public async joinRoom(accessToken: string, room: MatrixRoom): Promise<MatrixRoomJoinResponse> {
    if (room.status === MatrixRoomStatus.JOINED) {
      return Promise.resolve({ room_id: room.id })
    }

    return this.httpClient.post<MatrixRoomJoinRequest, MatrixRoomJoinResponse>(
      `/rooms/${room.id}/join`,
      {},
      { accessToken }
    )
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
