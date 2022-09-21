import { isCreateEvent, isJoinEvent, isMessageEvent } from '../utils/events'
import {
  MatrixSyncJoinedRoom,
  MatrixSyncInvitedRoom,
  MatrixSyncLeftRoom,
  MatrixSyncRooms
} from './api/MatrixSync'
import { MatrixMessage } from './MatrixMessage'
import { MatrixStateEvent } from './MatrixStateEvent'

export enum MatrixRoomStatus {
  UNKNOWN,
  JOINED,
  INVITED,
  LEFT
}

export class MatrixRoom {
  /**
   * Reconstruct rooms from a sync response
   *
   * @param roomSync
   */
  public static fromSync(roomSync?: MatrixSyncRooms): MatrixRoom[] {
    if (!roomSync) {
      return []
    }

    function create<T>(
      rooms: { [key: string]: T },
      creator: (id: string, room: T) => MatrixRoom
    ): MatrixRoom[] {
      return Object.entries(rooms).map(([id, room]) => creator(id, room))
    }

    return [
      ...create(roomSync.join ?? {}, MatrixRoom.fromJoined),
      ...create(roomSync.invite ?? {}, MatrixRoom.fromInvited),
      ...create(roomSync.leave ?? {}, MatrixRoom.fromLeft)
    ]
  }

  /**
   * Reconstruct a room from an ID or object
   *
   * @param roomOrId
   * @param status
   */
  public static from(roomOrId: string | MatrixRoom, status?: MatrixRoomStatus): MatrixRoom {
    return typeof roomOrId === 'string'
      ? new MatrixRoom(roomOrId, status || MatrixRoomStatus.UNKNOWN)
      : status !== undefined
      ? new MatrixRoom(roomOrId.id, status, roomOrId.members, roomOrId.messages)
      : roomOrId
  }

  /**
   * Merge new and old state and remove duplicates
   *
   * @param newState
   * @param previousState
   */
  public static merge(newState: MatrixRoom, previousState?: MatrixRoom): MatrixRoom {
    if (!previousState || previousState.id !== newState.id) {
      return MatrixRoom.from(newState)
    }

    return new MatrixRoom(
      newState.id,
      newState.status,
      [...previousState.members, ...newState.members].filter(
        (member, index, array) => array.indexOf(member) === index
      ),
      [...previousState.messages, ...newState.messages]
    )
  }

  /**
   * Create a room from a join
   *
   * @param id
   * @param joined
   */
  private static fromJoined(id: string, joined: MatrixSyncJoinedRoom): MatrixRoom {
    const events = [...joined.state.events, ...joined.timeline.events]
    const members = MatrixRoom.getMembersFromEvents(events)
    const messages = MatrixRoom.getMessagesFromEvents(events)

    return new MatrixRoom(id, MatrixRoomStatus.JOINED, members, messages)
  }

  /**
   * Create a room from an invite
   *
   * @param id
   * @param invited
   */
  private static fromInvited(id: string, invited: MatrixSyncInvitedRoom): MatrixRoom {
    const members = MatrixRoom.getMembersFromEvents(invited.invite_state.events)

    return new MatrixRoom(id, MatrixRoomStatus.INVITED, members)
  }

  /**
   * Create a room from a leave
   *
   * @param id
   * @param left
   */
  private static fromLeft(id: string, left: MatrixSyncLeftRoom): MatrixRoom {
    const events = [...left.state.events, ...left.timeline.events]
    const members = MatrixRoom.getMembersFromEvents(events)
    const messages = MatrixRoom.getMessagesFromEvents(events)

    return new MatrixRoom(id, MatrixRoomStatus.LEFT, members, messages)
  }

  /**
   * Extract members from an event
   *
   * @param events
   */
  private static getMembersFromEvents(events: MatrixStateEvent[]): string[] {
    return MatrixRoom.getUniqueEvents(
      events.filter((event) => isCreateEvent(event) || isJoinEvent(event))
    )
      .map((event) => event.sender)
      .filter((member, index, array) => array.indexOf(member) === index)
  }

  /**
   * Extract messages from an event
   *
   * @param events
   */
  private static getMessagesFromEvents(events: MatrixStateEvent[]): MatrixMessage<any>[] {
    return MatrixRoom.getUniqueEvents(events.filter(isMessageEvent))
      .map((event) => MatrixMessage.from(event))
      .filter(Boolean) as MatrixMessage<any>[]
  }

  /**
   * Get unique events and remove duplicates
   *
   * @param events
   */
  private static getUniqueEvents(events: MatrixStateEvent[]): MatrixStateEvent[] {
    const eventIds: Record<string, number> = {}
    const uniqueEvents: MatrixStateEvent[] = []

    events.forEach((event: MatrixStateEvent, index: number) => {
      const eventId = event.event_id
      if (eventId === undefined || !(eventId in eventIds)) {
        if (eventId !== undefined) {
          eventIds[eventId] = index
        }

        uniqueEvents.push(event)
      }
    })

    return uniqueEvents
  }

  private constructor(
    public readonly id: string,
    public readonly status: MatrixRoomStatus = MatrixRoomStatus.UNKNOWN,
    public readonly members: string[] = [],
    public messages: MatrixMessage<any>[] = []
  ) {}
}
