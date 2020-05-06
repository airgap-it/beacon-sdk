import { MatrixClientOptions } from './MatrixClientOptions'
import { MatrixHttpClient } from './MatrixHttpClient'
import { MatrixRoom, MatrixRoomStatus } from './models/MatrixRoom'
import { MatrixRoomService } from './services/MatrixRoomService'
import { MatrixAccountService } from './services/MatrixUserService'

export class MatrixClient {
  private accessToken?: string

  public get joinedRooms(): MatrixRoom[] {
    return Array.from(this.roomService.rooms.values()).filter(
      (room) => room.status === MatrixRoomStatus.JOINED
    )
  }

  public get invitedRooms(): MatrixRoom[] {
    return Array.from(this.roomService.rooms.values()).filter(
      (room) => room.status === MatrixRoomStatus.INVITED
    )
  }

  public get leftRooms(): MatrixRoom[] {
    return Array.from(this.roomService.rooms.values()).filter(
      (room) => room.status === MatrixRoomStatus.LEFT
    )
  }

  public static create(config: MatrixClientOptions): MatrixClient {
    const httpClient = new MatrixHttpClient(config.baseUrl)

    const accountService = new MatrixAccountService(httpClient)
    const roomService = new MatrixRoomService(httpClient)

    return new MatrixClient(accountService, roomService)
  }

  constructor(
    private readonly accountService: MatrixAccountService,
    private readonly roomService: MatrixRoomService
  ) {}

  public async login(user: { id: string; password: string; deviceId: string }): Promise<void> {
    const response = await this.accountService.login(user.id, user.password, user.deviceId)

    this.accessToken = response.access_token
  }

  public async sync(): Promise<void> {
    await this.requiresAuthorization('sync', async (accessToken) => {
      const response = await this.accountService.sync(accessToken)
      this.roomService.storeRooms(response.rooms)
    })
  }

  public async createTrustedPrivateRoom(...members: string[]): Promise<string> {
    return this.requiresAuthorization('createRoom', async (accessToken) => {
      const response = await this.roomService.createRoom(accessToken, {
        invite: members,
        preset: 'trusted_private_chat',
        is_direct: true
      })

      return response.room_id
    })
  }

  public async inviteToRooms(user: string, ...roomsOrIds: string[] | MatrixRoom[]): Promise<void> {
    await this.requiresAuthorization('invite', (accessToken) => {
      return Promise.all(
        (roomsOrIds as any[]).map((roomOrId) =>
          this.roomService
            .inviteToRoom(accessToken, user, roomOrId)
            .catch((error) => console.warn(error))
        )
      )
    })
  }

  public async joinRooms(...roomsOrIds: string[] | MatrixRoom[]): Promise<void> {
    return this.requiresAuthorization('join', async (accessToken) => {
      await Promise.all(
        (roomsOrIds as any[]).map((roomOrId) =>
          this.roomService.joinRoom(accessToken, roomOrId).catch((error) => console.warn(error))
        )
      )
      return this.sync()
    })
  }

  private async requiresAuthorization<T>(
    name: string,
    action: (accessToken: string) => Promise<T>
  ): Promise<T> {
    if (!this.accessToken) {
      return Promise.reject(`${name} requires authorization but no access token has been provided.`)
    }

    return action(this.accessToken)
  }
}
