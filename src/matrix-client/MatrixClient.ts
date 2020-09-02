import { Storage } from '../storage/Storage'
import { MatrixClientStore } from './MatrixClientStore'
import { MatrixHttpClient } from './MatrixHttpClient'
import { MatrixRoom, MatrixRoomStatus } from './models/MatrixRoom'
import { MatrixRoomService } from './services/MatrixRoomService'
import { MatrixUserService } from './services/MatrixUserService'
import { MatrixEventService } from './services/MatrixEventService'
import { MatrixSyncResponse } from './models/api/MatrixSync'
import { MatrixClientEventEmitter } from './MatrixClientEventEmitter'
import { MatrixClientEventType, MatrixClientEvent } from './models/MatrixClientEvent'

interface MatrixClientOptions {
  baseUrl: string
  storage: Storage
}

interface MatrixLoginConfig {
  id: string
  password: string
  deviceId: string
}

const MAX_POLLING_RETRIES = 3

export class MatrixClient {
  public static create(config: MatrixClientOptions): MatrixClient {
    const store = new MatrixClientStore(config.storage)
    const eventEmitter = new MatrixClientEventEmitter()

    const httpClient = new MatrixHttpClient(config.baseUrl)

    const accountService = new MatrixUserService(httpClient)
    const roomService = new MatrixRoomService(httpClient)
    const eventService = new MatrixEventService(httpClient)

    return new MatrixClient(store, eventEmitter, accountService, roomService, eventService)
  }

  public get joinedRooms(): MatrixRoom[] {
    return Object.values(this.store.get('rooms')).filter(
      (room) => room.status === MatrixRoomStatus.JOINED
    )
  }

  public get invitedRooms(): MatrixRoom[] {
    return Object.values(this.store.get('rooms')).filter(
      (room) => room.status === MatrixRoomStatus.INVITED
    )
  }

  public get leftRooms(): MatrixRoom[] {
    return Object.values(this.store.get('rooms')).filter(
      (room) => room.status === MatrixRoomStatus.LEFT
    )
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

    await this.store.update({
      accessToken: response.access_token
    })

    return new Promise((resolve, reject) => {
      this.poll(
        0,
        async (pollingResponse: MatrixSyncResponse) => {
          if (!this.store.get('isRunning')) {
            resolve()
          }
          await this.store.update({
            isRunning: true,
            syncToken: pollingResponse.next_batch,
            pollingTimeout: 30000,
            pollingRetries: 0,
            rooms: MatrixRoom.fromSync(pollingResponse.rooms)
          })
        },
        async (error) => {
          if (!this.store.get('isRunning')) {
            reject(error)
          }
          await this.store.update({
            isRunning: false,
            pollingRetries: this.store.get('pollingRetries') + 1
          })
        }
      )
    })
  }

  public subscribe<T extends MatrixClientEventType>(
    event: T,
    listener: (event: MatrixClientEvent<T>) => void
  ): void {
    this.eventEmitter.on(event, listener)
  }

  public unsubscribe(
    event: MatrixClientEventType,
    listener?: (event: MatrixClientEvent<any>) => void
  ): void {
    if (listener) {
      this.eventEmitter.removeListener(event, listener)
    } else {
      this.eventEmitter.removeAllListeners(event)
    }
  }

  public getRoomById(id: string): MatrixRoom {
    return this.store.getRoom(id)
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
    await this.requiresAuthorization('invite', (accessToken) =>
      Promise.all(
        (roomsOrIds as any[]).map((roomOrId) => {
          const room = this.store.getRoom(roomOrId)
          this.roomService
            .inviteToRoom(accessToken, user, room)
            .catch((error) => console.warn(error))
        })
      )
    )
  }

  public async joinRooms(...roomsOrIds: string[] | MatrixRoom[]): Promise<void> {
    await this.requiresAuthorization('join', (accessToken) =>
      Promise.all(
        (roomsOrIds as any[]).map((roomOrId) => {
          const room = this.store.getRoom(roomOrId)

          return this.roomService.joinRoom(accessToken, room).catch((error) => console.warn(error))
        })
      )
    )
  }

  public async sendTextMessage(roomOrId: string | MatrixRoom, message: string): Promise<void> {
    try {
      await this.requiresAuthorization('send', async (accessToken) => {
        const room = this.store.getRoom(roomOrId)
        const txnId = await this.createTxnId()

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
    } catch (error) {
      console.error(error)
    }
  }

  private poll(
    interval: number,
    onSyncSuccess: (response: MatrixSyncResponse) => void,
    onSyncError: (error: unknown) => void
  ): void {
    const store = this.store
    const sync = this.sync.bind(this)

    const pollSync = async (): Promise<void> => {
      let continueSyncing: boolean = false
      try {
        const response = await sync()
        onSyncSuccess(response)

        continueSyncing = true
      } catch (error) {
        onSyncError(error)

        continueSyncing = store.get('pollingRetries') < MAX_POLLING_RETRIES
        console.warn('Could not sync:', error)
        if (continueSyncing) {
          console.log('Retry syncing...')
        }
      } finally {
        if (continueSyncing) {
          setTimeout(pollSync, interval)
        } else {
          throw new Error(`Max polling retries exeeded: ${MAX_POLLING_RETRIES}`)
        }
      }
    }

    pollSync()
  }

  private async sync(): Promise<MatrixSyncResponse> {
    return this.requiresAuthorization('sync', async (accessToken) =>
      this.eventService.sync(accessToken, {
        pollingTimeout: this.store.get('pollingTimeout'),
        syncToken: this.store.get('syncToken')
      })
    )
  }

  private async requiresAuthorization<T>(
    name: string,
    action: (accessToken: string) => Promise<T>
  ): Promise<T> {
    const storedToken: string | undefined = this.store.get('accessToken')

    if (!storedToken) {
      return Promise.reject(`${name} requires authorization but no access token has been provided.`)
    }

    return action(storedToken)
  }

  private async createTxnId(): Promise<string> {
    const timestamp = new Date().getTime()
    const counter = this.store.get('txnNo')

    await this.store.update({
      txnNo: counter + 1
    })

    return `m${timestamp}.${counter}`
  }
}
