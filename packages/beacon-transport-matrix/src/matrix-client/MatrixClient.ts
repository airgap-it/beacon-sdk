import { Storage } from '@mavrykdynamics/beacon-types'
import { Logger } from '@mavrykdynamics/beacon-core'
import { ExposedPromise } from '@mavrykdynamics/beacon-utils'
import { MatrixClientStore } from './MatrixClientStore'
import { MatrixHttpClient } from './MatrixHttpClient'
import { MatrixRoom, MatrixRoomStatus } from './models/MatrixRoom'
import { MatrixRoomService } from './services/MatrixRoomService'
import { MatrixUserService } from './services/MatrixUserService'
import { MatrixEventService } from './services/MatrixEventService'
import { MatrixSyncResponse } from './models/api/MatrixSync'
import { MatrixClientEventEmitter } from './MatrixClientEventEmitter'
import { MatrixClientEventType, MatrixClientEvent } from './models/MatrixClientEvent'

const logger = new Logger('MatrixClient')

interface MatrixClientOptions {
  baseUrl: string
  storage: Storage
}

interface MatrixLoginConfig {
  id: string
  password: string
  deviceId: string
}

const IMMEDIATE_POLLING_RETRIES = 3
const RETRY_INTERVAL = 5000

/**
 * The matrix client used to connect to the matrix network
 */
export class MatrixClient {
  private isActive: boolean = true
  private _isReady: ExposedPromise<void> = new ExposedPromise()

  constructor(
    private readonly store: MatrixClientStore,
    private readonly eventEmitter: MatrixClientEventEmitter,
    private readonly userService: MatrixUserService,
    private readonly roomService: MatrixRoomService,
    private readonly eventService: MatrixEventService,
    private readonly httpClient: MatrixHttpClient
  ) {
    this.store.onStateChanged((oldState, newState, stateChange) => {
      this.eventEmitter.onStateChanged(oldState, newState, stateChange)
    }, 'rooms')
  }

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

    return new MatrixClient(
      store,
      eventEmitter,
      accountService,
      roomService,
      eventService,
      httpClient
    )
  }

  /**
   * Return all the rooms we are currently part of
   */
  public get joinedRooms(): Promise<MatrixRoom[]> {
    return new Promise(async (resolve) => {
      await this.isConnected()

      resolve(
        Object.values(this.store.get('rooms')).filter(
          (room) => room.status === MatrixRoomStatus.JOINED
        )
      )
    })
  }

  /**
   * Return all the rooms to which we have received invitations
   */
  public get invitedRooms(): Promise<MatrixRoom[]> {
    return new Promise(async (resolve) => {
      await this.isConnected()

      resolve(
        Object.values(this.store.get('rooms')).filter(
          (room) => room.status === MatrixRoomStatus.INVITED
        )
      )
    })
  }

  /**
   * Return all the rooms that we left
   */
  public get leftRooms(): Promise<MatrixRoom[]> {
    return new Promise(async (resolve) => {
      await this.isConnected()

      resolve(
        Object.values(this.store.get('rooms')).filter(
          (room) => room.status === MatrixRoomStatus.LEFT
        )
      )
    })
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

    const initialPollingResult = new Promise<void>(async (resolve, reject) => {
      await this.poll(
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

    initialPollingResult
      .then(() => {
        this._isReady.resolve()
      })
      .catch(console.error)

    return initialPollingResult
  }

  public async isConnected(): Promise<void> {
    return this._isReady.promise
  }

  /**
   * Stop all running requests
   */
  public async stop(): Promise<void> {
    logger.log(`MATRIX CLIENT STOPPED`)
    this.isActive = false
    this._isReady = new ExposedPromise()

    return this.httpClient.cancelAllRequests()
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
    listener: (event: MatrixClientEvent<any>) => void
  ): void {
    if (listener) {
      this.eventEmitter.removeListener(event, listener)
    }
  }

  /**
   * Unsubscribe from all matrix events of this type
   *
   * @param event
   * @param listener
   */
  public unsubscribeAll(event: MatrixClientEventType): void {
    this.eventEmitter.removeListener(event)
  }

  public async getRoomById(id: string): Promise<MatrixRoom> {
    await this.isConnected()

    return this.store.getRoom(id)
  }

  /**
   * Create a private room with the supplied members
   *
   * @param members Members that will be in the room
   */
  public async createTrustedPrivateRoom(...members: string[]): Promise<string> {
    await this.isConnected()

    return this.requiresAuthorization('createRoom', async (accessToken) => {
      const response = await this.roomService.createRoom(accessToken, {
        room_version: '5',
        invite: members,
        preset: 'public_chat',
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
    await this.isConnected()

    await this.requiresAuthorization('invite', (accessToken) =>
      Promise.all(
        (roomsOrIds as any[]).map((roomOrId) => {
          const room = this.store.getRoom(roomOrId)
          this.roomService
            .inviteToRoom(accessToken, user, room)
            .catch((error) => logger.warn('inviteToRooms', error))
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
    await this.isConnected()

    await this.requiresAuthorization('join', (accessToken) =>
      Promise.all(
        (roomsOrIds as any[]).map((roomOrId) => {
          const room = this.store.getRoom(roomOrId)

          return this.roomService.joinRoom(accessToken, room)
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
  public async sendTextMessage(roomId: string, message: string): Promise<void> {
    await this.isConnected()

    await this.requiresAuthorization('send', async (accessToken) => {
      const txnId = await this.createTxnId()

      return this.eventService.sendMessage(
        accessToken,
        roomId,
        {
          msgtype: 'm.text',
          body: message
        },
        txnId
      )
    })
  }

  /**
   * Poll the server to get the latest data and get notified of changes
   *
   * @param interval
   * @param onSyncSuccess
   * @param onSyncError
   */
  private async poll(
    interval: number,
    onSyncSuccess: (response: MatrixSyncResponse) => void,
    onSyncError: (error: unknown) => void
  ): Promise<void> {
    const store = this.store
    const sync = this.sync.bind(this)

    const pollSync = async (
      resolve: (value?: void | PromiseLike<void> | undefined) => void,
      reject: (reason?: any) => void
    ): Promise<void> => {
      let syncingRetries: number = 0
      try {
        const response = await sync()
        onSyncSuccess(response)
      } catch (error) {
        onSyncError(error)

        syncingRetries = store.get('pollingRetries')
        // console.warn('Could not sync:', error)
        if (this.isActive) {
          logger.log(`Retry syncing... ${syncingRetries} retries so far`)
        }
      } finally {
        if (this.isActive) {
          setTimeout(
            async () => {
              await pollSync(resolve, reject)
            },
            syncingRetries > IMMEDIATE_POLLING_RETRIES ? RETRY_INTERVAL + interval : interval
          )
        } else {
          reject(new Error(`Syncing stopped manually.`))
        }
      }
    }

    return new Promise(pollSync)
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
