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

/**
 * The matrix client used to connect to the matrix network
 */
export class MatrixClient {
  /**
   * Create a matrix client based on the options provided
   *
   * @param config
   */
  public static create(config: MatrixClientOptions): MatrixClient {
    const store = new MatrixClientStore(config.storage)
    const eventEmitter = new MatrixClientEventEmitter()

    const httpClient = new MatrixHttpClient(config.baseUrl)

    const accountService = new MatrixUserService(httpClient)
    const roomService = new MatrixRoomService(httpClient)
    const eventService = new MatrixEventService(httpClient)

    return new MatrixClient(store, eventEmitter, accountService, roomService, eventService)
  }

  /**
   * Return all the rooms we are currently part of
   */
  public get joinedRooms(): MatrixRoom[] {
    return Object.values(this.store.get('rooms')).filter(
      (room) => room.status === MatrixRoomStatus.JOINED
    )
  }

  /**
   * Return all the rooms to which we have received invitations
   */
  public get invitedRooms(): MatrixRoom[] {
    return Object.values(this.store.get('rooms')).filter(
      (room) => room.status === MatrixRoomStatus.INVITED
    )
  }

  /**
   * Return all the rooms that we left
   */
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

  /**
   * Initiate the connection to the matrix node and log in
   *
   * @param user
   */
  public async start(user: MatrixLoginConfig): Promise<void> {
    const response = await this.userService.login(user.id, user.password, user.deviceId)

    await this.store.update({
      accessToken: response.access_token
    })

    return new Promise(async (resolve, reject) => {
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

  /**
   * Subscribe to new matrix events
   *
   * @param event
   * @param listener
   */
  public subscribe<T extends MatrixClientEventType>(
    event: T,
    listener: (event: MatrixClientEvent<T>) => void
  ): void {
    this.eventEmitter.on(event, listener)
  }

  /**
   * Unsubscribe from matrix events
   *
   * @param event
   * @param listener
   */
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

  /**
   * Create a private room with the supplied members
   *
   * @param members Members that will be in the room
   */
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

  /**
   * Invite user to rooms
   *
   * @param user The user to be invited
   * @param roomsOrIds The rooms the user will be invited to
   */
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

  /**
   * Join rooms
   *
   * @param roomsOrIds
   */
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

  /**
   * Send a text message
   *
   * @param roomOrId
   * @param message
   */
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

  /**
   * Poll the server to get the latest data and get notified of changes
   *
   * @param interval
   * @param onSyncSuccess
   * @param onSyncError
   */
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
        // console.warn('Could not sync:', error)
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

    pollSync().catch((e) => console.log('caught error', e))
  }

  /**
   * Get state from server
   */
  private async sync(): Promise<MatrixSyncResponse> {
    return this.requiresAuthorization('sync', async (accessToken) =>
      this.eventService.sync(accessToken, {
        pollingTimeout: this.store.get('pollingTimeout'),
        syncToken: this.store.get('syncToken')
      })
    )
  }

  /**
   * A helper method that makes sure an access token is provided
   *
   * @param name
   * @param action
   */
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

  /**
   * Create a transaction ID
   */
  private async createTxnId(): Promise<string> {
    const timestamp = new Date().getTime()
    const counter = this.store.get('txnNo')

    await this.store.update({
      txnNo: counter + 1
    })

    return `m${timestamp}.${counter}`
  }
}
