import { MatrixClientOptions } from './MatrixClientOptions'
import { MatrixHttpClient } from './http/MatrixHttpClient'
import { MatrixRoom, MatrixRoomStatus } from './models/MatrixRoom'

export class MatrixClient {
  // TODO: make private when used
  public userId?: string
  public deviceId?: string

  public rooms: Map<string, MatrixRoom> = new Map()

  public get joinedRooms(): MatrixRoom[] {
    return Array.from(this.rooms.values()).filter((room) => room.status === MatrixRoomStatus.JOINED)
  }

  public get invitedRooms(): MatrixRoom[] {
    return Array.from(this.rooms.values()).filter(
      (room) => room.status === MatrixRoomStatus.INVITED
    )
  }

  public get leftRooms(): MatrixRoom[] {
    return Array.from(this.rooms.values()).filter((room) => room.status === MatrixRoomStatus.LEFT)
  }

  public static create(config: MatrixClientOptions): MatrixClient {
    const httpClient = new MatrixHttpClient(config.baseUrl)

    return new MatrixClient(httpClient)
  }

  constructor(private readonly httpClient: MatrixHttpClient) {}

  public async login(user: { id: string; password: string; deviceId: string }): Promise<void> {
    const response = await this.httpClient.authenticate(user.id, user.password, {
      device_id: user.deviceId
    })

    this.userId = response.user_id
    this.deviceId = response.device_id
  }

  public async sync(): Promise<void> {
    const rooms = await this.httpClient.sync()

    this.rooms.clear()
    this.saveRooms(rooms.join, MatrixRoom.fromJoined)
    this.saveRooms(rooms.invite, MatrixRoom.fromInvited)
    this.saveRooms(rooms.leave, MatrixRoom.fromLeft)
  }

  public async inviteToRooms(user: string, ...roomIds: string[]): Promise<void>
  public async inviteToRooms(user: string, ...rooms: MatrixRoom[]): Promise<void>
  public async inviteToRooms(user: string, ...roomsOrIds: string[] | MatrixRoom[]): Promise<void> {
    await Promise.all(
      (roomsOrIds as any[]).map((roomOrId) =>
        this.inviteToRoom(user, roomOrId).catch((error) => console.warn(error))
      )
    )
  }

  public async joinRooms(...roomIds: string[]): Promise<void>
  public async joinRooms(...rooms: MatrixRoom[]): Promise<void>
  public async joinRooms(...roomsOrIds: string[] | MatrixRoom[]): Promise<void> {
    await Promise.all(
      (roomsOrIds as any[]).map((roomOrId) =>
        this.joinRoom(roomOrId).catch((error) => console.warn(error))
      )
    )
    return this.sync()
  }

  private async inviteToRoom(user: string, roomOrId: string | MatrixRoom): Promise<void> {
    const room = MatrixRoom.from(roomOrId)
    if (!this.rooms.get(room.id) || this.rooms.get(room.id)?.status !== MatrixRoomStatus.JOINED) {
      return Promise.reject(`User is not a member of room ${room.id}.`)
    }

    await this.httpClient.invite(user, room.id)
  }

  private async joinRoom(roomOrId: string | MatrixRoom): Promise<void> {
    const room = MatrixRoom.from(roomOrId)
    if (this.rooms.get(room.id)?.status === MatrixRoomStatus.JOINED) {
      return Promise.resolve()
    }

    await this.httpClient.joinRoom(room.id)
  }

  private saveRooms<T>(rooms: { [key: string]: T }, creator: (id: string, room: T) => MatrixRoom) {
    Object.entries(rooms).forEach(([id, room]) => {
      this.rooms.set(id, creator(id, room))
    })
  }
}
