import { MatrixHttpClient } from '../MatrixHttpClient'
import { MatrixRoom, MatrixRoomStatus } from '../models/MatrixRoom'

import { MatrixRoomCreateRequest, MatrixRoomCreateResponse } from '../models/api/MatrixRoomCreate'
import { MatrixRoomInviteResponse } from '../models/api/MatrixRoomInvite'
import { MatrixRoomJoinResponse } from '../models/api/MatrixRoomJoin'

/**
 * A service to help with matrix room management
 */
export class MatrixRoomService {
  constructor(private readonly httpClient: MatrixHttpClient) {}

  /**
   * Create a room
   *
   * @param accessToken
   * @param config
   */
  public async createRoom(
    accessToken: string,
    config: MatrixRoomCreateRequest = {}
  ): Promise<MatrixRoomCreateResponse> {
    return this.httpClient.post('/createRoom', config, { accessToken })
  }

  /**
   * Invite a user to a room
   *
   * @param accessToken
   * @param user
   * @param room
   */
  public async inviteToRoom(
    accessToken: string,
    user: string,
    room: MatrixRoom
  ): Promise<MatrixRoomInviteResponse> {
    if (room.status !== MatrixRoomStatus.JOINED && room.status !== MatrixRoomStatus.UNKNOWN) {
      return Promise.reject(`User is not a member of room ${room.id}.`)
    }

    return this.httpClient.post(
      `/rooms/${encodeURIComponent(room.id)}/invite`,
      { user_id: user },
      { accessToken }
    )
  }

  /**
   * Join a specific room
   *
   * @param accessToken
   * @param room
   */
  public async joinRoom(accessToken: string, room: MatrixRoom): Promise<MatrixRoomJoinResponse> {
    if (room.status === MatrixRoomStatus.JOINED) {
      return Promise.resolve({ room_id: room.id })
    }

    return this.httpClient.post(`/rooms/${encodeURIComponent(room.id)}/join`, {}, { accessToken })
  }

  /**
   * Get all joined rooms
   *
   * @param accessToken
   */
  public async getJoinedRooms(accessToken: string): Promise<MatrixRoomJoinResponse> {
    return this.httpClient.get(`/joined_rooms`, undefined, { accessToken })
  }
}
