import { EventEmitter } from 'events'
import { MatrixStateStore, MatrixStateUpdate } from './MatrixClientStore'
import { MatrixRoomStatus } from './models/MatrixRoom'
import { MatrixMessage } from './models/MatrixMessage'

type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>
type Predicate<T, R extends T> = (object: T) => object is R

export enum MatrixClientEvent {
  INVITE = 'invite',
  MESSAGE = 'message'
}

export class MatrixClientEventEmitter extends EventEmitter {
  private readonly eventEmitProviders: Map<
    string,
    <T, R extends T>() => [Predicate<T, R>, (event: string, object: R) => void]
  > = new Map([
    [MatrixClientEvent.INVITE, () => [this.isInvite, this.emitInvite]],
    [MatrixClientEvent.MESSAGE, () => [this.isMessage, this.emitMessage]]
  ] as [string, <T, R extends T>() => [Predicate<T, R>, (event: string, object: R) => void]][])

  public onStateChanged(
    _oldState: MatrixStateStore,
    _newState: MatrixStateStore,
    stateChange: Partial<MatrixStateUpdate>
  ) {
    for (let event in MatrixClientEvent) {
      this.emitIfEvent(event, stateChange)
    }
  }

  private emitIfEvent<T>(event: string, object: T) {
    const provider = this.eventEmitProviders.get(event)
    if (provider) {
      const [predicate, emitter] = provider()
      if (predicate(object)) {
        emitter(event, object)
      }
    }
  }

  private isInvite(
    stateChange: Partial<MatrixStateUpdate>
  ): stateChange is AtLeast<MatrixStateUpdate, 'rooms'> {
    return stateChange.rooms?.some((room) => room.status === MatrixRoomStatus.INVITED) || false
  }

  private emitInvite(event: string, stateChange: AtLeast<MatrixStateUpdate, 'rooms'>) {
    stateChange.rooms
      .filter((room) => room.status === MatrixRoomStatus.INVITED)
      .map((room) => room.id)
      .forEach((id) => {
        this.emit(event, id)
      })
  }

  private isMessage(
    stateChange: Partial<MatrixStateUpdate>
  ): stateChange is AtLeast<MatrixStateUpdate, 'rooms'> {
    return stateChange.rooms?.some((room) => room.messages.length > 0) || false
  }

  private emitMessage(event: string, stateChange: AtLeast<MatrixStateUpdate, 'rooms'>) {
    stateChange.rooms
      .filter((room) => room.messages.length > 0)
      .map((room) =>
        room.messages.map((message) => [room.id, message] as [string, MatrixMessage<any>])
      )
      .reduce((flatten, toFlatten) => flatten.concat(toFlatten), [])
      .forEach(([roomId, message]) => {
        this.emit(event, roomId, message)
      })
  }
}
