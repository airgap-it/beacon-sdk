import { MatrixClientStore } from './MatrixClientStore'
import { MatrixHttpClient } from './MatrixHttpClient'
import { MatrixRoom, MatrixRoomStatus } from './models/MatrixRoom'
import { MatrixRoomService } from './services/MatrixRoomService'
import { MatrixUserService } from './services/MatrixUserService'
import { MatrixEventService } from './services/MatrixEventService'
import { MatrixSyncResponse } from './models/api/MatrixSync'
import { MatrixClientEventEmitter, MatrixClientEvent } from './MatrixClientEventEmitter'

interface MatrixClientOptions {
  baseUrl: string
}

interface MatrixLoginConfig {
  id: string
  password: string
  deviceId: string
}

export class MatrixClient {
  public get joinedRooms(): MatrixRoom[] {
    return Array.from(this.store.get('rooms').values()).filter(
      (room) => room.status === MatrixRoomStatus.JOINED
    )
  }

  public get invitedRooms(): MatrixRoom[] {
    return Array.from(this.store.get('rooms').values()).filter(
      (room) => room.status === MatrixRoomStatus.INVITED
    )
  }

  public get leftRooms(): MatrixRoom[] {
    return Array.from(this.store.get('rooms').values()).filter(
      (room) => room.status === MatrixRoomStatus.LEFT
    )
  }

  public static create(config: MatrixClientOptions): MatrixClient {
    const store = new MatrixClientStore()
    const eventEmitter = new MatrixClientEventEmitter()

    const httpClient = new MatrixHttpClient(config.baseUrl)

    const accountService = new MatrixUserService(httpClient)
    const roomService = new MatrixRoomService(httpClient)
    const eventService = new MatrixEventService(httpClient)

    return new MatrixClient(store, eventEmitter, accountService, roomService, eventService)
  }

  constructor(
    private readonly store: MatrixClientStore,
    private readonly eventEmitter: MatrixClientEventEmitter,
    private readonly userService: MatrixUserService,
    private readonly roomService: MatrixRoomService,
    private readonly eventService: MatrixEventService
  ) {
    this.store.onStateChanged((oldState, newState, stateChange) => {
      this.eventEmitter.onStateChanged(oldState, newState, stateChange)
    }, 'rooms')
  }

  public async start(user: MatrixLoginConfig): Promise<void> {
    const response = await this.userService.login(user.id, user.password, user.deviceId)

    this.store.update({
      accessToken: response.access_token
    })

    return new Promise((resolve, reject) => {
      this.poll(
        0,
        (response: MatrixSyncResponse) => {
          if (!this.store.get('isRunning')) {
            resolve()
          }
          this.store.update({
            isRunning: true,
            syncToken: response.next_batch,
            pollingTimeout: 30000,
            rooms: MatrixRoom.fromSync(response.rooms)
          })
        },
        (error) => {
          if (!this.store.get('isRunning')) {
            reject(error)
          }
          console.warn('Could not sync:', error)
          this.store.update({
            isRunning: false
          })
        }
      )
    })
  }

  public subscribe(event: MatrixClientEvent, listener: (...args: any) => void) {
    this.eventEmitter.on(event, listener)
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
        (roomsOrIds as any[]).map((roomOrId) => {
          const room = this.store.getRoom(roomOrId)
          this.roomService
            .inviteToRoom(accessToken, user, room)
            .catch((error) => console.warn(error))
        })
      )
    })
  }

  public async joinRooms(...roomsOrIds: string[] | MatrixRoom[]): Promise<void> {
    await this.requiresAuthorization('join', (accessToken) => {
      return Promise.all(
        (roomsOrIds as any[]).map((roomOrId) => {
          const room = this.store.getRoom(roomOrId)
          return this.roomService.joinRoom(accessToken, room).catch((error) => console.warn(error))
        })
      )
    })
  }

  public async sendTextMessage(roomOrId: string | MatrixRoom, message: string): Promise<void> {
    await this.requiresAuthorization('send', async (accessToken) => {
      const room = this.store.getRoom(roomOrId)
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

  private poll(
    interval: number,
    onSyncSuccess: (response: MatrixSyncResponse) => void,
    onSyncError: (error) => void
  ) {
    const sync = this.sync.bind(this)
    async function pollSync() {
      try {
        const response = await sync()
        onSyncSuccess(response)

        setTimeout(pollSync, interval)
      } catch (error) {
        onSyncError(error)
      }
    }
    pollSync()
  }

  private async sync(): Promise<MatrixSyncResponse> {
    return this.requiresAuthorization('sync', async (accessToken) => {
      return this.eventService.sync(accessToken, {
        pollingTimeout: this.store.get('pollingTimeout'),
        syncToken: this.store.get('syncToken')
      })
    })
  }

  private async requiresAuthorization<T>(
    name: string,
    action: (accessToken: string) => Promise<T>
  ): Promise<T> {
    if (!this.store.get('accessToken')) {
      return Promise.reject(`${name} requires authorization but no access token has been provided.`)
    }

    return action(this.store.get('accessToken')!)
  }

  private createTxnId(): string {
    const timestamp = new Date().getTime()
    const counter = this.store.get('txnNo')

    this.store.update({
      txnNo: counter + 1
    })

    return `m${timestamp}.${counter}`
  }
}
