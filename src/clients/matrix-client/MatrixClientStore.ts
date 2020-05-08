import { MatrixRoom, MatrixRoomStatus } from './models/MatrixRoom'

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

export class MatrixClientStore {
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

  public get<T extends keyof MatrixStateStore>(key: T): MatrixStateStore[T] {
    return this.state[key]
  }

  public getRoom(roomOrId: string | MatrixRoom): MatrixRoom {
    const room = MatrixRoom.from(roomOrId, MatrixRoomStatus.UNKNOWN)
    return this.state.rooms.get(room.id) || room
  }

  public update(stateUpdate: Partial<MatrixStateUpdate>) {
    const oldState = Object.assign({}, this.state)
    this.state = {
      isRunning: stateUpdate.isRunning || this.state.isRunning,
      userId: stateUpdate.userId || this.state.userId,
      deviceId: stateUpdate.deviceId || this.state.deviceId,
      txnNo: stateUpdate.txnNo || this.state.txnNo,
      accessToken: stateUpdate.accessToken || this.state.accessToken,
      syncToken: stateUpdate.syncToken || this.state.syncToken,
      pollingTimeout: stateUpdate.pollingTimeout || this.state.pollingTimeout,
      rooms: this.mergeRooms(this.state.rooms, stateUpdate.rooms)
    }

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

  private mergeRooms(
    oldRooms: Map<string, MatrixRoom>,
    _newRooms?: MatrixRoom[]
  ): Map<string, MatrixRoom> {
    if (!_newRooms) {
      return oldRooms
    }

    const newRooms = new Map(_newRooms.map((room) => [room.id, room]))

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
