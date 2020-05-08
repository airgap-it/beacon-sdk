import { EventEmitter } from 'events'
import { MatrixStateStore, MatrixStateUpdate } from './MatrixClientStore'
import { MatrixRoomStatus } from './models/MatrixRoom'
import { MatrixMessage } from './models/MatrixMessage'
import { MatrixClientEventType, MatrixClientEventContent } from './models/MatrixClientEvent'

type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>
type Predicate<T, R extends T> = (object: T) => object is R

export class MatrixClientEventEmitter extends EventEmitter {
  private readonly eventEmitProviders: Map<
    string,
    <T, R extends T>() => [Predicate<T, R>, (event: string, object: R) => void]
  > = new Map([
    [MatrixClientEventType.INVITE, () => [this.isInvite, this.emitInvite.bind(this)]],
    [MatrixClientEventType.MESSAGE, () => [this.isMessage, this.emitMessage.bind(this)]]
  ] as [string, <T, R extends T>() => [Predicate<T, R>, (event: string, object: R) => void]][])

  public onStateChanged(
    _oldState: MatrixStateStore,
    _newState: MatrixStateStore,
    stateChange: Partial<MatrixStateUpdate>
  ) {
    for (let event in MatrixClientEventType) {
      this.emitIfEvent(MatrixClientEventType[event], stateChange)
    }
  }

  private emitIfEvent<T>(eventType: string, object: T) {
    const provider = this.eventEmitProviders.get(eventType)
    if (provider) {
      const [predicate, emitter] = provider()
      if (predicate(object)) {
        emitter(eventType, object)
      }
    }
  }

  private emitClientEvent<T extends MatrixClientEventType>(
    eventType: T,
    content: MatrixClientEventContent<T>
  ) {
    this.emit(eventType, {
      type: eventType,
      content
    })
  }

  private isInvite(
    stateChange: Partial<MatrixStateUpdate>
  ): stateChange is AtLeast<MatrixStateUpdate, 'rooms'> {
    return stateChange.rooms?.some((room) => room.status === MatrixRoomStatus.INVITED) || false
  }

  private emitInvite(
    eventType: MatrixClientEventType.INVITE,
    stateChange: AtLeast<MatrixStateUpdate, 'rooms'>
  ) {
    stateChange.rooms
      .filter((room) => room.status === MatrixRoomStatus.INVITED)
      .map((room) => room.id)
      .forEach((id) => {
        this.emitClientEvent(eventType, {
          roomId: id
        })
      })
  }

  private isMessage(
    stateChange: Partial<MatrixStateUpdate>
  ): stateChange is AtLeast<MatrixStateUpdate, 'rooms'> {
    return stateChange.rooms?.some((room) => room.messages.length > 0) || false
  }

  private emitMessage(
    eventType: MatrixClientEventType.MESSAGE,
    stateChange: AtLeast<MatrixStateUpdate, 'rooms'>
  ) {
    stateChange.rooms
      .filter((room) => room.messages.length > 0)
      .map((room) =>
        room.messages.map((message) => [room.id, message] as [string, MatrixMessage<any>])
      )
      .reduce((flatten, toFlatten) => flatten.concat(toFlatten), [])
      .forEach(([roomId, message]) => {
        this.emitClientEvent(eventType, {
          roomId,
          message
        })
      })
  }
}
