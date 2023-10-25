import { EventEmitter } from './EventEmitter'
import { keys } from '@mavrykdynamics/beacon-utils'
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

  /**
   * This method is called every time the state is changed
   *
   * @param _oldState
   * @param _newState
   * @param stateChange
   */
  public onStateChanged(
    _oldState: MatrixStateStore,
    _newState: MatrixStateStore,
    stateChange: Partial<MatrixStateUpdate>
  ): void {
    for (const event of keys(MatrixClientEventType)) {
      this.emitIfEvent(MatrixClientEventType[event], stateChange)
    }
  }

  /**
   * Emit the message if we have listeners registered for that type
   *
   * @param eventType
   * @param object
   */
  private emitIfEvent<T>(eventType: string, object: T): void {
    const provider = this.eventEmitProviders.get(eventType)
    if (provider) {
      const [predicate, emitter] = provider()
      if (predicate(object)) {
        emitter(eventType, object)
      }
    }
  }

  /**
   * Emit a client event
   *
   * @param eventType
   * @param content
   */
  private emitClientEvent<T extends MatrixClientEventType>(
    eventType: T,
    content: MatrixClientEventContent<T>,
    timestamp?: number
  ): void {
    this.emit(eventType, {
      type: eventType,
      content,
      timestamp
    })
  }

  /**
   * Check if event is an invite
   *
   * @param stateChange
   */
  private isInvite(
    stateChange: Partial<MatrixStateUpdate>
  ): stateChange is AtLeast<MatrixStateUpdate, 'rooms'> {
    return stateChange.rooms
      ? stateChange.rooms.some((room) => room.status === MatrixRoomStatus.INVITED)
      : false
  }

  /**
   * Emit an invite
   *
   * @param eventType
   * @param stateChange
   */
  private emitInvite(
    eventType: MatrixClientEventType.INVITE,
    stateChange: AtLeast<MatrixStateUpdate, 'rooms'>
  ): void {
    stateChange.rooms
      .filter((room) => room.status === MatrixRoomStatus.INVITED)
      .map((room) => [room.id, room.members] as [string, string[]])
      .forEach(([id, members]) => {
        this.emitClientEvent(eventType, {
          roomId: id,
          members: members
        })
      })
  }

  /**
   * Check if event is a message
   *
   * @param stateChange
   */
  private isMessage(
    stateChange: Partial<MatrixStateUpdate>
  ): stateChange is AtLeast<MatrixStateUpdate, 'rooms'> {
    return stateChange.rooms ? stateChange.rooms.some((room) => room.messages.length > 0) : false
  }

  /**
   * Emit an event to all rooms
   *
   * @param eventType
   * @param stateChange
   */
  private emitMessage(
    eventType: MatrixClientEventType.MESSAGE,
    stateChange: AtLeast<MatrixStateUpdate, 'rooms'>
  ): void {
    stateChange.rooms
      .filter((room) => room.messages.length > 0)
      .map((room) =>
        room.messages.map(
          (message) =>
            [room.id, message, message.timestamp] as [string, MatrixMessage<unknown>, number]
        )
      )
      .reduce((flatten, toFlatten) => flatten.concat(toFlatten), [])
      .forEach(([roomId, message, timestamp]) => {
        this.emitClientEvent(
          eventType,
          {
            roomId,
            message
          },
          timestamp
        )
      })
  }
}
