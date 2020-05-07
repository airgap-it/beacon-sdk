import { EventEmitter } from 'events'
import { MatrixStateStore, MatrixStateUpdate } from './MatrixClientStore'
import { MatrixRoomStatus } from './models/MatrixRoom'

type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>
type Predicate<T, R extends T> = (object: T) => object is R

export enum MatrixClientEvent {
  INVITE = 'invite',
  MESSAGE = 'message',
  CHANNEL_OPENING = 'channel_opening'
}

export class MatrixClientEventEmitter extends EventEmitter {
  private readonly eventEmitProviders: Map<
    string,
    <T, R extends T>() => [Predicate<T, R>, (event: string, object: R) => void]
  > = new Map([
    [MatrixClientEvent.INVITE, () => [this.isInvite, this.emitInvite]],
    [MatrixClientEvent.MESSAGE, () => [this.isMessage, this.emitMessage]],
    [MatrixClientEvent.CHANNEL_OPENING, () => [this.isChannelOpening, this.emitChannelOpening]]
  ])

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
    // TODO
    return stateChange.rooms?.some((_room) => false) || false
  }

  private emitMessage(event: string, stateChange: AtLeast<MatrixStateUpdate, 'rooms'>) {
    // TODO
    this.emit(event, stateChange)
  }

  private isChannelOpening(_stateChange: Partial<MatrixStateUpdate>): _stateChange is any {
    // TOOD
    return false
  }

  private emitChannelOpening(event: string, _stateChange: any) {
    // TODO
    this.emit(event)
  }
}
