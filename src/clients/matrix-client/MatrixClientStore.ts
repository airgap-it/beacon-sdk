import { MatrixRoom, MatrixRoomStatus } from './models/MatrixRoom'

interface MatrixState {
  isRunning: boolean
  userId: string | undefined
  deviceId: string | undefined
  txnNo: number
  accessToken: string | undefined
  syncToken: string | undefined
  rooms: MatrixRoom[] | Map<string, MatrixRoom>
}

interface MatrixStateStore extends MatrixState {
  rooms: Map<string, MatrixRoom>
}

interface MatrixStateUpdate extends MatrixState {
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
    rooms: new Map()
  }

  public get<T extends keyof MatrixStateStore>(key: T): MatrixStateStore[T] {
    return this.state[key]
  }

  public getRoom(roomOrId: string | MatrixRoom): MatrixRoom {
    const room = MatrixRoom.from(roomOrId, MatrixRoomStatus.UNKNOWN)
    return this.state.rooms.get(room.id) || room
  }

  public update(newState: Partial<MatrixStateUpdate>) {
    this.state = {
      isRunning: newState.isRunning || this.state.isRunning,
      userId: newState.userId || this.state.userId,
      deviceId: newState.deviceId || this.state.deviceId,
      txnNo: newState.txnNo || this.state.txnNo,
      accessToken: newState.accessToken || this.state.accessToken,
      syncToken: newState.syncToken || this.state.syncToken,
      rooms: this.mergeRooms(this.state.rooms, newState.rooms)
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
}
