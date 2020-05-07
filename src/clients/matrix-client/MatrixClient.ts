import { MatrixHttpClient } from './MatrixHttpClient'
import { MatrixRoom, MatrixRoomStatus } from './models/MatrixRoom'
import { MatrixRoomService } from './services/MatrixRoomService'
import { MatrixUserService } from './services/MatrixUserService'
import { MatrixEventService } from './services/MatrixEventService'

interface MatrixClientOptions {
  baseUrl: string
}

interface MatrixLoginConfig {
  id: string
  password: string
  deviceId: string
}

export class MatrixClient {
  private accessToken?: string
  private txnCounter: number = 0

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

    const accountService = new MatrixUserService(httpClient)
    const roomService = new MatrixRoomService(httpClient)
    const eventService = new MatrixEventService(httpClient)

    return new MatrixClient(accountService, roomService, eventService)
  }

  constructor(
    private readonly userService: MatrixUserService,
    private readonly roomService: MatrixRoomService,
    private readonly eventService: MatrixEventService
  ) {}

  public async login(user: MatrixLoginConfig): Promise<void> {
    const response = await this.userService.login(user.id, user.password, user.deviceId)

    this.accessToken = response.access_token
    this.txnCounter = 0

    return this.sync()
  }

  public async sync(): Promise<void> {
    await this.requiresAuthorization('sync', async (accessToken) => {
      const response = await this.userService.sync(accessToken)
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

      await this.sync()
      return response.room_id
    })
  }

  public async inviteToRooms(user: string, ...roomsOrIds: string[] | MatrixRoom[]): Promise<void> {
    await this.requiresAuthorization('invite', (accessToken) => {
      return Promise.all(
        (roomsOrIds as any[]).map((roomOrId) => {
          const room = this.roomService.getRoom(roomOrId)
          this.roomService
            .inviteToRoom(accessToken, user, room)
            .catch((error) => console.warn(error))
        })
      )
    })
  }

  public async joinRooms(...roomsOrIds: string[] | MatrixRoom[]): Promise<void> {
    return this.requiresAuthorization('join', async (accessToken) => {
      await Promise.all(
        (roomsOrIds as any[]).map((roomOrId) => {
          const room = this.roomService.getRoom(roomOrId)
          return this.roomService.joinRoom(accessToken, room).catch((error) => console.warn(error))
        })
      )
      return this.sync()
    })
  }

  public async sendTextMessage(roomOrId: string | MatrixRoom, message: string): Promise<void> {
    await this.requiresAuthorization('send', async (accessToken) => {
      const room = this.roomService.getRoom(roomOrId)
      const txnId = this.createTxnId()
      return this.eventService.sendMessage(
        accessToken,
        room,
        {
          msgtype: 'm.text',
          body: message
        },
        txnId
      )
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

  private createTxnId(): string {
    const timestamp = new Date().getTime()
    const counter = this.txnCounter++

    return `m${timestamp}.${counter}`
  }
}
