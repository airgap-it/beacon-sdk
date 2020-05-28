import { keys } from '../utils/utils'
import { MatrixRoom, MatrixRoomStatus } from './models/MatrixRoom'

interface MatrixStateStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

interface MatrixState {
  isRunning: boolean
  userId: string | undefined
  deviceId: string | undefined
  txnNo: number
  accessToken: string | undefined
  syncToken: string | undefined
  pollingTimeout: number | undefined
  pollingRetries: number
  rooms: MatrixRoom[] | { [key: string]: MatrixRoom }
}

type OnStateChangedListener = (
  oldState: MatrixStateStore,
  newState: MatrixStateStore,
  stateChange: Partial<MatrixStateUpdate>
) => void

export interface MatrixStateStore extends MatrixState {
  rooms: { [key: string]: MatrixRoom }
}

export interface MatrixStateUpdate extends MatrixState {
  rooms: MatrixRoom[]
}

const STORAGE_KEY = 'beacon:sdk-matrix-preserved-state'
const PRESERVED_FIELDS: (keyof MatrixState)[] = ['syncToken', 'rooms']

export class MatrixClientStore {
  public static createLocal(): MatrixClientStore {
    const localStorage = (global as any).localStorage

    return new MatrixClientStore(localStorage)
  }

  private state: MatrixStateStore = {
    isRunning: false,
    userId: undefined,
    deviceId: undefined,
    txnNo: 0,
    accessToken: undefined,
    syncToken: undefined,
    pollingTimeout: undefined,
    pollingRetries: 0,
    rooms: {}
  }

  private readonly onStateChangedListeners: Map<
    keyof MatrixState | 'all',
    OnStateChangedListener
  > = new Map()

  constructor(private readonly storage?: MatrixStateStorage) {
    this.initFromStorage()
  }

  public get<T extends keyof MatrixStateStore>(key: T): MatrixStateStore[T] {
    return this.state[key]
  }

  public getRoom(roomOrId: string | MatrixRoom): MatrixRoom {
    const room = MatrixRoom.from(roomOrId, MatrixRoomStatus.UNKNOWN)
    return this.state.rooms[room.id] || room
  }

  public update(stateUpdate: Partial<MatrixStateUpdate>): void {
    const oldState = Object.assign({}, this.state)
    this.setState(stateUpdate)
    this.updateStorage(stateUpdate)

    this.notifyListeners(oldState, this.state, stateUpdate)
  }

  public onStateChanged(
    listener: OnStateChangedListener,
    ...subscribed: (keyof MatrixState)[]
  ): void {
    if (subscribed.length > 0) {
      subscribed.forEach((key) => {
        this.onStateChangedListeners.set(key, listener)
      })
    } else {
      this.onStateChangedListeners.set('all', listener)
    }
  }

  private initFromStorage(): void {
    if (this.storage) {
      const preserved = this.storage.getItem(STORAGE_KEY)
      this.setState(preserved ? JSON.parse(preserved) : {})
    }
  }

  private updateStorage(stateUpdate: Partial<MatrixStateUpdate>): void {
    const updatedCachedFields = Object.entries(stateUpdate).filter(
      ([key, value]) => PRESERVED_FIELDS.includes(key as keyof MatrixStateUpdate) && !!value
    )

    if (this.storage && updatedCachedFields.length > 0) {
      const filteredState: Record<string, any> = {}
      PRESERVED_FIELDS.forEach((key) => {
        filteredState[key] = this.state[key]
      })

      this.storage.setItem(STORAGE_KEY, JSON.stringify(filteredState))
    }
  }

  private setState(partialState: Partial<MatrixState>): void {
    this.state = {
      isRunning: partialState.isRunning || this.state.isRunning,
      userId: partialState.userId || this.state.userId,
      deviceId: partialState.deviceId || this.state.deviceId,
      txnNo: partialState.txnNo || this.state.txnNo,
      accessToken: partialState.accessToken || this.state.accessToken,
      syncToken: partialState.syncToken || this.state.syncToken,
      pollingTimeout: partialState.pollingTimeout || this.state.pollingTimeout,
      pollingRetries: partialState.pollingRetries || this.state.pollingRetries,
      rooms: this.mergeRooms(this.state.rooms, partialState.rooms)
    }
  }

  private mergeRooms(
    oldRooms: { [key: string]: MatrixRoom },
    _newRooms?: MatrixRoom[] | { [key: string]: MatrixRoom }
  ): { [key: string]: MatrixRoom } {
    if (!_newRooms) {
      return oldRooms
    }

    let newRooms: { [key: string]: MatrixRoom } = {}
    if (Array.isArray(_newRooms)) {
      _newRooms.forEach((room: MatrixRoom) => {
        newRooms[room.id] = room
      })
    } else {
      newRooms = _newRooms
    }

    return {
      ...oldRooms,
      ...newRooms
    }
  }

  private notifyListeners(
    oldState: MatrixStateStore,
    newState: MatrixStateStore,
    stateChange: Partial<MatrixStateUpdate>
  ): void {
    const listenForAll = this.onStateChangedListeners.get('all')
    if (listenForAll) {
      listenForAll(oldState, newState, stateChange)
    }

    keys(stateChange)
      .filter((key) => stateChange[key] !== undefined)
      .forEach((key) => {
        const listener = this.onStateChangedListeners.get(key)
        if (listener) {
          listener(oldState, newState, stateChange)
        }
      })
  }
}
