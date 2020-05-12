import { MatrixHttpClient } from '../MatrixHttpClient'
import { MatrixRoom, MatrixRoomStatus } from '../models/MatrixRoom'

import { MatrixRoomCreateRequest, MatrixRoomCreateResponse } from '../models/api/MatrixRoomCreate'
import { MatrixRoomInviteResponse } from '../models/api/MatrixRoomInvite'
import { MatrixRoomJoinResponse } from '../models/api/MatrixRoomJoin'

export class MatrixRoomService {
  constructor(private readonly httpClient: MatrixHttpClient) {}

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
}
