import { MatrixRoom, MatrixRoomStatus } from './models/MatrixRoom'
import { isArray } from 'util'

interface MatrixStateStorage {
  getItem(key: string): string
  setItem(key: string, value: string)
}

interface MatrixState {
  isRunning: boolean
  userId: string | undefined
  deviceId: string | undefined
  txnNo: number
  accessToken: string | undefined
  syncToken: string | undefined
  pollingTimeout: number | undefined
  rooms: MatrixRoom[] | Map<string, MatrixRoom>
}

type OnStateChangedListener = (
  oldState: MatrixStateStore,
  newState: MatrixStateStore,
  stateChange: Partial<MatrixStateUpdate>
) => void

export interface MatrixStateStore extends MatrixState {
  rooms: Map<string, MatrixRoom>
}

export interface MatrixStateUpdate extends MatrixState {
  rooms: MatrixRoom[]
}

const STORAGE_KEY = 'matrix_preserved_state'
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
    rooms: new Map()
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
    return this.state.rooms.get(room.id) || room
  }

  public update(stateUpdate: Partial<MatrixStateUpdate>) {
    const oldState = Object.assign({}, this.state)
    this.setState(stateUpdate)
    this.updateStorage(stateUpdate)

    this.notifyListeners(oldState, this.state, stateUpdate)
  }

  public onStateChanged(listener: OnStateChangedListener, ...subscribed: (keyof MatrixState)[]) {
    if (subscribed.length > 0) {
      subscribed.forEach((key) => {
        this.onStateChangedListeners.set(key, listener)
      })
    } else {
      this.onStateChangedListeners.set('all', listener)
    }
  }

  private initFromStorage() {
    if (this.storage) {
      const cached = this.storage.getItem(STORAGE_KEY)
      this.setState(JSON.parse(cached))
    }
  }

  private updateStorage(stateUpdate: Partial<MatrixStateUpdate>) {
    const updatedCachedFields = Object.entries(stateUpdate).filter(
      ([key, value]) => PRESERVED_FIELDS.includes(key as keyof MatrixStateUpdate) && !!value
    )

    if (this.storage && updatedCachedFields.length > 0) {
      const filteredState = {}
      for (let key in PRESERVED_FIELDS) {
        filteredState[key] = this.state[key]
      }

      this.storage.setItem(STORAGE_KEY, JSON.stringify(filteredState))
    }
  }

  private setState(partialState: Partial<MatrixState>) {
    this.state = {
      isRunning: partialState.isRunning || this.state.isRunning,
      userId: partialState.userId || this.state.userId,
      deviceId: partialState.deviceId || this.state.deviceId,
      txnNo: partialState.txnNo || this.state.txnNo,
      accessToken: partialState.accessToken || this.state.accessToken,
      syncToken: partialState.syncToken || this.state.syncToken,
      pollingTimeout: partialState.pollingTimeout || this.state.pollingTimeout,
      rooms: this.mergeRooms(this.state.rooms, partialState.rooms)
    }
  }

  private mergeRooms(
    oldRooms: Map<string, MatrixRoom>,
    _newRooms?: MatrixRoom[] | Map<string, MatrixRoom>
  ): Map<string, MatrixRoom> {
    if (!_newRooms) {
      return oldRooms
    }

    const newRooms = isArray(_newRooms)
      ? new Map(_newRooms.map((room) => [room.id, room]))
      : _newRooms

    return new Map([
      ...Array.from(oldRooms.entries()).filter(([id, _]) => !newRooms.get(id)),
      ...Array.from(newRooms.entries())
    ])
  }

  private notifyListeners(
    oldState: MatrixStateStore,
    newState: MatrixStateStore,
    stateChange: Partial<MatrixStateUpdate>
  ) {
    const listenForAll = this.onStateChangedListeners.get('all')
    if (listenForAll) {
      listenForAll(oldState, newState, stateChange)
    }

    Object.keys(stateChange)
      .filter((key) => stateChange[key] !== undefined)
      .forEach((key) => {
        const listener = this.onStateChangedListeners.get(key as keyof MatrixState)
        if (listener) {
          listener(oldState, newState, stateChange)
        }
      })
  }
}
