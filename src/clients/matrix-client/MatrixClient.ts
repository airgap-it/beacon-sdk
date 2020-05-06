import { MatrixClientOptions } from './MatrixClientOptions'
import { MatrixHttpClient } from './http/MatrixHttpClient'
import { MatrixRoom, MatrixRoomStatus } from './models/MatrixRoom'

export class MatrixClient {
  // TODO: make private when used
  public userId?: string
  public deviceId?: string

  public rooms: MatrixRoom[] = []

  public get joinedRooms(): MatrixRoom[] {
    return this.rooms.filter((room) => room.status === MatrixRoomStatus.JOINED)
  }

  public get invitedRooms(): MatrixRoom[] {
    return this.rooms.filter((room) => room.status === MatrixRoomStatus.INVITED)
  }

  public get leftRooms(): MatrixRoom[] {
    return this.rooms.filter((room) => room.status === MatrixRoomStatus.LEFT)
  }

  public static create(config: MatrixClientOptions): MatrixClient {
    const httpClient = new MatrixHttpClient(config.baseUrl)

    return new MatrixClient(httpClient)
  }

  constructor(private readonly httpClient: MatrixHttpClient) {}

  public async login(data: { user: string; password: string; deviceId: string }): Promise<void> {
    const response = await this.httpClient.authenticate(data.user, data.password, {
      deviceId: data.deviceId
    })

    this.userId = response.user_id
    this.deviceId = response.device_id
  }

  public async sync(): Promise<void> {
    const rooms = await this.httpClient.sync()

    this.rooms = []
    this.saveRooms(rooms.join, MatrixRoom.fromJoined)
    this.saveRooms(rooms.invite, MatrixRoom.fromInvited)
    this.saveRooms(rooms.leave, MatrixRoom.fromLeft)
  }

  private saveRooms<T>(rooms: { [key: string]: T }, creator: (id: string, room: T) => MatrixRoom) {
    this.rooms.push(...Object.entries(rooms).map(([id, room]) => creator(id, room)))
  }
}
